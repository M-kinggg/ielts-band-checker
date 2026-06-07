const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const PDFDocument = require('pdfkit');

// Define Directories
const pdfDir = path.join(__dirname, 'sample-pdfs');
const screenshotDir = path.join(__dirname, 'screenshots');

// Ensure output directories exist
fs.mkdirSync(pdfDir, { recursive: true });
fs.mkdirSync(screenshotDir, { recursive: true });

// Sample Essay Contents
const essays = {
  task1_weak: {
    filename: 'task1_weak.pdf',
    title: 'UK Energy Consumption - Weak Task 1',
    text: "The bar chart show about energy in UK. We can see that coal is used a lot in 1970 but then it go down. Oil is also there. Gas become more popular. Nuclear is small. The chart have five energy types. Overall things changed a lot over the years we can see many changes happened.   "
  },
  task1_strong: {
    filename: 'task1_strong.pdf',
    title: 'UK Energy Consumption - Strong Task 1',
    text: "The bar chart illustrates the changes in energy consumption from five different sources in the United Kingdom between 1970 and 2000. Overall, it is evident that coal experienced the most dramatic decline over the period, while natural gas emerged as the dominant energy source by 2000. In 1970, coal accounted for the largest share of energy consumption at approximately 40%, however this figure fell sharply to around 18% by the end of the period. Conversely, the consumption of natural gas rose considerably from roughly 15% in 1970 to become the leading source at nearly 38% in 2000. Oil remained relatively stable throughout, fluctuating between 30% and 35%, whereas nuclear energy, despite showing modest growth, continued to represent the smallest proportion at approximately 8% by 2000."
  },
  task2_weak: {
    filename: 'task2_weak.pdf',
    title: 'Technology & Social Interaction - Weak Task 2',
    text: "I think technology is bad for people. Because everyone is on phone all the time. My friend also do this. They don't talk to each other in real life. Social media is very bad. Facebook and Instagram make people sad. Lot of study show this. People can't make friend in real now. Technology make us alone. I agree that technology is bad and make people less social. Government should do something about this problem and stop it."
  },
  task2_strong: {
    filename: 'task2_strong.pdf',
    title: 'Technology & Social Interaction - Strong Task 2',
    text: "In recent decades, rapid advancements in digital technology have fundamentally transformed the way individuals communicate and interact. While some argue that this shift has rendered society increasingly isolated, others contend that technology has merely redefined the nature of social connection. In my view, although technology presents certain social challenges, its overall impact on human interaction is largely positive when used responsibly. Proponents of the view that technology undermines social bonds often point to the prevalence of screen time at the expense of face-to-face interaction. Research conducted by the American Psychological Association suggests that excessive social media use is correlated with heightened feelings of loneliness and anxiety, particularly among adolescents. Furthermore, the phenomenon of phubbing, whereby individuals prioritise their devices over present company, has become increasingly normalised, potentially eroding the quality of personal relationships. Nevertheless, it would be an oversimplification to conclude that technology is inherently antisocial. Platforms such as video calling applications have enabled individuals to maintain meaningful relationships across vast geographical distances, a feat that would have been impossible a generation ago. Moreover, online communities provide valuable spaces for individuals with niche interests or marginalised identities to find connection and support. In conclusion, while the misuse of technology can undoubtedly contribute to social fragmentation, its responsible application holds considerable potential to enrich and broaden human connection. It is therefore the manner in which technology is used, rather than technology itself, that determines its social impact."
  }
};

/**
 * Creates a structured PDF document from essay text
 */
async function generatePDF(filename, title, text) {
  const filePath = path.join(pdfDir, filename);
  const writeStream = fs.createWriteStream(filePath);
  const doc = new PDFDocument({
    size: [600, 850],
    compress: false,
    info: {
      CreationDate: new Date(2026, 0, 1),
      ModDate: new Date(2026, 0, 1)
    }
  });
  doc.pipe(writeStream);

  // Header Title
  doc.font('Helvetica-Bold')
     .fontSize(16)
     .fillColor('#1a1a1a')
     .text(title, 50, 50);

  // IELTS Meta
  doc.font('Helvetica')
     .fontSize(10)
     .fillColor('#888888')
     .text('Sample Submission for IELTS Writing Evaluation', 50, 75);

  // Underline separator
  doc.moveTo(50, 90)
     .lineTo(550, 90)
     .lineWidth(0.5)
     .stroke();

  // Paragraph text
  doc.font('Helvetica').fontSize(11).fillColor('#333333').text(text, 50, 110, { width: 500, lineGap: 5 });

  doc.end();

  await new Promise((resolve) => writeStream.on('finish', resolve));
  console.log(`[+] PDF Created: ${filename} -> ${filePath}`);
}

/**
 * Automates browser interaction via Puppeteer
 */
async function runTestSuite() {
  console.log('\n==================================================');
  console.log('  STARTING IELTS BAND CHECKER AUTOMATION TESTING  ');
  console.log('==================================================\n');

  // PART A: Generate PDFs
  for (const key of Object.keys(essays)) {
    const item = essays[key];
    await generatePDF(item.filename, item.title, item.text);
  }

  console.log('\n[+] Launching headful Chrome browser...');
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();
  const results = [];

  // Helper functions for Puppeteer interactions
  const clickResetButton = async () => {
    console.log('    Resetting page view...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const resetBtn = buttons.find(b => b.textContent.includes('Write Another Essay'));
      if (resetBtn) resetBtn.click();
    });
    await page.waitForSelector('textarea[rows="12"]', { visible: true });
  };

  const selectTaskType = async (taskType) => {
    console.log(`    Selecting ${taskType === 'task1' ? 'Task 1' : 'Task 2'}...`);
    await page.evaluate((type) => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const targetText = type === 'task1' ? 'Task 1' : 'Task 2';
      const btn = buttons.find(b => b.textContent.includes(targetText));
      if (btn) btn.click();
    }, taskType);
  };

  const uploadFile = async (filePath) => {
    console.log(`    Uploading file: ${path.basename(filePath)}...`);
    const fileInput = await page.waitForSelector('input[type="file"]');
    await fileInput.uploadFile(filePath);
    
    // Wait for text extraction confirmation alert
    await page.waitForFunction(() => {
      const divs = Array.from(document.querySelectorAll('div'));
      return divs.some(d => d.textContent.includes('Successfully extracted text'));
    }, { timeout: 15000 });
  };

  const triggerAnalysis = async () => {
    console.log('    Clicking Analyze button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.includes('Analyze Essay'));
      if (btn) btn.click();
    });

    // Wait for evaluation scores panel to render
    await page.waitForFunction(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      return spans.some(s => s.textContent.includes('out of 9.0'));
    }, { timeout: 35000 });
  };

  const getScore = async () => {
    const score = await page.evaluate(() => {
      const spans = Array.from(document.querySelectorAll('span'));
      const targetSpan = spans.find(s => s.textContent.includes('out of 9.0'));
      if (targetSpan) {
        const valSpan = targetSpan.previousElementSibling;
        return valSpan ? parseFloat(valSpan.textContent) : null;
      }
      return null;
    });
    console.log(`    Calculated overall band: ${score}`);
    return score;
  };

  try {
    // Navigate to front-end Vite local server
    await page.goto('http://localhost:5173');
    await page.waitForSelector('textarea[rows="12"]');

    // -------------------------------------------------------------
    // TEST 1: task1_weak.pdf
    // -------------------------------------------------------------
    console.log('\n[TEST 1] Processing task1_weak.pdf...');
    await uploadFile(path.join(pdfDir, essays.task1_weak.filename));
    await selectTaskType('task1');
    await triggerAnalysis();
    const score1 = await getScore();
    await page.screenshot({ path: path.join(screenshotDir, 'test1_result.png') });
    results.push({ testNum: 1, file: 'task1_weak', task: 'Task 1', band: score1, status: 'Pending' });

    // -------------------------------------------------------------
    // TEST 2: task1_strong.pdf
    // -------------------------------------------------------------
    console.log('\n[TEST 2] Processing task1_strong.pdf...');
    await clickResetButton();
    await uploadFile(path.join(pdfDir, essays.task1_strong.filename));
    await selectTaskType('task1');
    await triggerAnalysis();
    const score2 = await getScore();
    await page.screenshot({ path: path.join(screenshotDir, 'test2_result.png') });
    results.push({ testNum: 2, file: 'task1_strong', task: 'Task 1', band: score2, status: 'Pending' });

    // -------------------------------------------------------------
    // TEST 3: task2_weak.pdf
    // -------------------------------------------------------------
    console.log('\n[TEST 3] Processing task2_weak.pdf...');
    await clickResetButton();
    await uploadFile(path.join(pdfDir, essays.task2_weak.filename));
    await selectTaskType('task2');
    await triggerAnalysis();
    const score3 = await getScore();
    await page.screenshot({ path: path.join(screenshotDir, 'test3_result.png') });
    results.push({ testNum: 3, file: 'task2_weak', task: 'Task 2', band: score3, status: 'Pending' });

    // -------------------------------------------------------------
    // TEST 4: task2_strong.pdf
    // -------------------------------------------------------------
    console.log('\n[TEST 4] Processing task2_strong.pdf...');
    await clickResetButton();
    await uploadFile(path.join(pdfDir, essays.task2_strong.filename));
    await selectTaskType('task2');
    await triggerAnalysis();
    const score4 = await getScore();
    await page.screenshot({ path: path.join(screenshotDir, 'test4_result.png') });
    results.push({ testNum: 4, file: 'task2_strong', task: 'Task 2', band: score4, status: 'Pending' });

    // -------------------------------------------------------------
    // TEST 5: Typed Input (strong task 2)
    // -------------------------------------------------------------
    console.log('\n[TEST 5] Running typed input test...');
    await clickResetButton();
    await selectTaskType('task2');
    
    // Inject value programmatically in React textarea using dispatcher
    await page.evaluate((txtVal) => {
      const textarea = document.querySelector('textarea[rows="12"]');
      if (textarea) {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        nativeSetter.call(textarea, txtVal);
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, essays.task2_strong.text);

    await triggerAnalysis();
    const score5 = await getScore();
    await page.screenshot({ path: path.join(screenshotDir, 'test5_result.png') });
    results.push({ testNum: 5, file: 'typed input', task: 'Task 2', band: score5, status: 'Pending' });

    // -------------------------------------------------------------
    // POST-TEST PROCESS: Assertions & Warning Evaluations
    // -------------------------------------------------------------
    console.log('\n[+] Performing validation checks...');

    // Evaluate statuses
    results.forEach(res => {
      const isValidNumber = typeof res.band === 'number' && res.band >= 1.0 && res.band <= 9.0;
      if (isValidNumber) {
        res.status = '✓ Pass';
      } else {
        res.status = '✗ Fail';
      }
    });

    // Verify weak < strong
    const task1Diff = score2 - score1;
    const task2Diff = score4 - score3;

    if (score1 >= score2) {
      results[0].status = '✗ Fail (Not lower)';
      results[1].status = '✗ Fail (Not higher)';
      console.error('[-] ERROR: Weak Task 1 scored higher than or equal to Strong Task 1.');
    }
    if (score3 >= score4) {
      results[2].status = '✗ Fail (Not lower)';
      results[3].status = '✗ Fail (Not higher)';
      console.error('[-] ERROR: Weak Task 2 scored higher than or equal to Strong Task 2.');
    }

    // Print warning if difference < 1.0 band
    if (task1Diff < 1.0) {
      console.warn(`\n⚠️ Warning: Score difference between weak and strong (Task 1) is too small (${task1Diff.toFixed(1)} band) — check if Claude API key is active or mock grader is being used.`);
    }
    if (task2Diff < 1.0) {
      console.warn(`\n⚠️ Warning: Score difference between weak and strong (Task 2) is too small (${task2Diff.toFixed(1)} band) — check if Claude API key is active or mock grader is being used.`);
    }

    // Print final summary table
    console.log('\n===========================================================');
    console.log('                       TEST SUMMARY                        ');
    console.log('===========================================================');
    console.log('| Test | File          | Task   | Band Score | Status     |');
    console.log('|------|---------------|--------|------------|------------|');
    results.forEach(res => {
      const filePad = res.file.padEnd(13);
      const taskPad = res.task.padEnd(6);
      const bandPad = (res.band !== null ? res.band.toFixed(1) : 'null').padEnd(10);
      const statusPad = res.status.padEnd(10);
      console.log(`| ${res.testNum}    | ${filePad} | ${taskPad} | ${bandPad} | ${statusPad} |`);
    });
    console.log('===========================================================');

  } catch (error) {
    console.error('\n[-] Automation Test Runner execution failed:', error);
  } finally {
    console.log('\n[+] Closing Chrome browser in 3 seconds...');
    setTimeout(async () => {
      await browser.close();
      console.log('[+] Testing completed successfully.');
    }, 3000);
  }
}

// Run suite
runTestSuite();
