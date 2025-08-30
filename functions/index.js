const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall } = require("firebase-functions/v2/https");
const { onRequest } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions/v2");
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

// Set global options for all functions
setGlobalOptions({ region: "us-central1", memory: "1GiB" });

let db;

try {
  admin.initializeApp();
  db = admin.firestore();
  logger.info("Firebase Admin SDK initialized successfully.");
} catch (error) {
  logger.error("Error initializing Firebase Admin SDK:", error);
}

/**
 * Takes a screenshot of a website and uploads it to Firebase Storage
 */
const takeScreenshot = async (url, toolId) => {
  let browser = null;
  try {
    logger.info(`Taking screenshot of ${url} for tool ${toolId}`);
    
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    
    // Set viewport ve user agent (daha standart desktop boyutu)
    await page.setViewport({ width: 1440, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Navigate to the page with timeout
    await page.goto(url, { 
      waitUntil: 'networkidle0', // Daha iyi loading bekle
      timeout: 60000 
    });

    // Wait for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get page dimensions to avoid white space
    const dimensions = await page.evaluate(() => {
      return {
        width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
        height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight
      };
    });

    // Take screenshot with proper clipping
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: Math.min(1440, dimensions.viewportWidth),
        height: Math.min(900, dimensions.viewportHeight)
      }
      // PNG doesn't support quality parameter
    });

    await browser.close();
    browser = null;

    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const fileName = `screenshots/${toolId}_${Date.now()}.png`;
    const file = bucket.file(fileName);

    await file.save(screenshot, {
      metadata: {
        contentType: 'image/png',
        metadata: {
          toolId: toolId,
          originalUrl: url,
          createdAt: new Date().toISOString()
        }
      }
    });

    // Make the file publicly accessible
    await file.makePublic();

    // Get the public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    logger.info(`Screenshot saved successfully: ${publicUrl}`);
    return publicUrl;

  } catch (error) {
    logger.error(`Error taking screenshot for ${url}:`, error);
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        logger.error('Error closing browser:', closeError);
      }
    }
    
    // Return null if screenshot fails - we don't want to fail the entire submission
    return null;
  }
};

/**
 * Generates a URL slug from a name
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-');
};

/**
 * Clean URL to add referral tracking
 */
const cleanUrl = (url) => {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    // Remove existing ref parameters
    urlObj.searchParams.delete('ref');
    // Add our referral
    urlObj.searchParams.set('ref', 'toolslash');
    return urlObj.toString();
  } catch (error) {
    logger.error('Error cleaning URL:', error);
    return url;
  }
};

/**
 * Map Product Hunt categories to our predefined categories
 */
const mapCategory = (phCategory) => {
  const categoryMap = {
    'artificial-intelligence': 'AI',
    'developer-tools': 'Developer Tools',
    'productivity': 'Productivity',
    'design-tools': 'Design',
    'marketing': 'Marketing',
    'analytics': 'Analytics',
    'fintech': 'Finance',
    'social-media': 'Social Media',
    'e-commerce': 'E-commerce',
    'web3': 'Blockchain',
    'mobile-apps': 'Mobile',
    'saas': 'SaaS',
    'no-code': 'No-Code',
    'automation': 'Automation',
    'cybersecurity': 'Security',
    'video': 'Video',
    'audio': 'Audio',
    'education': 'Education',
    'health-fitness': 'Health & Fitness',
    'travel': 'Travel',
    'gaming': 'Gaming'
  };
  
  return categoryMap[phCategory] || 'Other';
};

/**
 * Scrape individual Product Hunt tool page
 */
const scrapeToolDetails = async (browser, toolUrl) => {
  let page = null;
  try {
    logger.info(`Scraping tool details from: ${toolUrl}`);
    
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(toolUrl, { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Extract tool information
    const toolData = await page.evaluate(() => {
      // Tool name
      const nameElement = document.querySelector('h1[data-sentry-component="LegacyText"]');
      const name = nameElement ? nameElement.textContent.trim() : '';

      // Tagline
      const taglineElement = document.querySelector('h2.text-18.text-gray-700');
      const tagline = taglineElement ? taglineElement.textContent.trim() : '';

      // Description
      const descElement = document.querySelector('[data-sentry-component="Description"] p');
      const description = descElement ? descElement.textContent.trim() : '';

      // Website URL
      const websiteElement = document.querySelector('[data-test="visit-website-button"]');
      const websiteUrl = websiteElement ? websiteElement.href : '';

      // Categories
      const categoryElements = document.querySelectorAll('[data-sentry-component="Categories"] a[href*="/categories/"]');
      const categories = Array.from(categoryElements).map(el => {
        const href = el.getAttribute('href');
        return href ? href.split('/categories/')[1] : '';
      }).filter(cat => cat);

      // Logo
      let logoUrl = '';
      const logoElement = document.querySelector('img[data-test*="-thumbnail"]');
      if (logoElement) {
        logoUrl = logoElement.src;
      } else {
        // Fallback to gallery image
        const galleryElement = document.querySelector('[data-sentry-component="Gallery"] img');
        if (galleryElement) {
          logoUrl = galleryElement.src;
        }
      }

      // Pricing
      const pricingElement = document.querySelector('[data-test="pricing-type"]');
      let pricingModel = '';
      if (pricingElement) {
        const pricingText = pricingElement.textContent.trim();
        if (pricingText === 'Payment Required') {
          pricingModel = 'Paid';
        } else {
          pricingModel = pricingText;
        }
      }

      return {
        name,
        tagline,
        description,
        websiteUrl,
        categories,
        logoUrl,
        pricingModel
      };
    });

    await page.close();
    return toolData;

  } catch (error) {
    logger.error(`Error scraping tool details from ${toolUrl}:`, error);
    if (page) {
      try {
        await page.close();
      } catch (closeError) {
        logger.error('Error closing page:', closeError);
      }
    }
    return null;
  }
};

/**
 * Step 1: Scrape Product Hunt main page for tool URLs only
 */
const scrapeProductHuntUrls = async () => {
  let browser = null;
  try {
    logger.info('Starting Product Hunt URL collection...');
    
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to Product Hunt homepage
    await page.goto('https://www.producthunt.com', { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000 
    });

    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract tool links from the main page
    const toolLinks = await page.evaluate(() => {
      const sections = document.querySelectorAll('section[data-test^="post-item-"]');
      const links = [];
      
      // Get first 30 tools only
      const maxTools = Math.min(sections.length, 30);
      
      for (let i = 0; i < maxTools; i++) {
        const section = sections[i];
        const linkElement = section.querySelector('a[href^="/products/"]');
        if (linkElement) {
          const href = linkElement.getAttribute('href');
          if (href) {
            links.push('https://www.producthunt.com' + href);
          }
        }
      }
      
      return links;
    });

    await browser.close();
    
    logger.info(`Found ${toolLinks.length} tool links on Product Hunt`);
    return toolLinks;

  } catch (error) {
    logger.error('Error scraping Product Hunt URLs:', error);
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        logger.error('Error closing browser:', closeError);
      }
    }
    
    throw error;
  }
};

/**
 * Step 2: Process individual tool URLs
 */
const processToolUrls = async (toolUrls) => {
  let browser = null;
  const tools = [];
  
  try {
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    for (let i = 0; i < toolUrls.length; i++) {
      const toolUrl = toolUrls[i];
      logger.info(`Processing tool ${i + 1}/${toolUrls.length}: ${toolUrl}`);
      
      try {
        const toolData = await scrapeToolDetails(browser, toolUrl);
        if (toolData && toolData.name && toolData.websiteUrl) {
          // Check if tool already exists BEFORE processing
          const existingQuery = await db.collection('tools')
            .where('name', '==', toolData.name)
            .limit(1)
            .get();
          
          if (existingQuery.empty) {
            // Website screenshot'ını al
            let screenshotUrl = '';
            const cleanWebsiteUrl = cleanUrl(toolData.websiteUrl);
            
            if (cleanWebsiteUrl) {
              try {
                logger.info(`📸 Taking screenshot for: ${toolData.name} - ${cleanWebsiteUrl}`);
                screenshotUrl = await takeScreenshot(cleanWebsiteUrl, `scrape_${Date.now()}`);
                if (screenshotUrl) {
                  logger.info(`📸 ✅ Screenshot taken: ${screenshotUrl}`);
                } else {
                  logger.warn(`📸 ⚠️ Screenshot failed for: ${toolData.name}`);
                }
              } catch (screenshotError) {
                logger.error(`📸 ❌ Screenshot error for ${toolData.name}:`, screenshotError.message);
              }
            }

            const processedTool = {
              ...toolData,
              websiteUrl: cleanWebsiteUrl,
              categories: toolData.categories.map(mapCategory),
              logoUrl: toolData.logoUrl || '',
              screenshotUrl: screenshotUrl || '', // YENİ FIELD!
              slug: generateSlug(toolData.name),
              status: 'approved',
              isFeatured: false,
              submittedByUID: null,
              submitterEmail: 'auto-scraper@toolslash.com',
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
              scrapedAt: admin.firestore.FieldValue.serverTimestamp(),
              source: 'producthunt-auto'
            };
            
            tools.push(processedTool);
            logger.info(`✅ Tool processed: ${toolData.name}`);
          } else {
            logger.info(`⏭️ Tool already exists, skipping: ${toolData.name}`);
          }
        } else {
          logger.warn(`❌ Failed to extract data from: ${toolUrl}`);
        }
      } catch (error) {
        logger.error(`❌ Error processing ${toolUrl}:`, error.message);
      }
      
      // Small delay between tools
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await browser.close();
    
    logger.info(`Successfully processed ${tools.length} new tools from ${toolUrls.length} URLs`);
    return tools;

  } catch (error) {
    logger.error('Error processing tool URLs:', error);
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        logger.error('Error closing browser:', closeError);
      }
    }
    
    throw error;
  }
};

/**
 * Save scraped tools to Firestore
 */
const saveScrapedTools = async (tools) => {
  if (!db) {
    throw new Error('Firestore not initialized');
  }

  const batch = db.batch();
  let savedCount = 0;
  
  for (const tool of tools) {
    try {
      // Check if tool already exists (by name or slug)
      const existingQuery = await db.collection('tools')
        .where('name', '==', tool.name)
        .limit(1)
        .get();
      
      if (existingQuery.empty) {
        // Tool doesn't exist, add it
        const docRef = db.collection('tools').doc();
        batch.set(docRef, tool);
        savedCount++;
        logger.info(`Will save new tool: ${tool.name}`);
      } else {
        logger.info(`Tool already exists, skipping: ${tool.name}`);
      }
    } catch (error) {
      logger.error(`Error checking/saving tool ${tool.name}:`, error);
    }
  }
  
  if (savedCount > 0) {
    await batch.commit();
    logger.info(`Successfully saved ${savedCount} new tools to Firestore`);
  } else {
    logger.info('No new tools to save');
  }
  
  return savedCount;
};

/**
 * Manual trigger for Product Hunt scraping (for testing)
 */
exports.scrapeProductHuntManual = onCall(async (request) => {
  try {
    logger.info('🚀 Starting manual Product Hunt scraping...');
    
    // Step 1: Get URLs
    logger.info('📋 Step 1: Collecting tool URLs...');
    const toolUrls = await scrapeProductHuntUrls();
    
    // Step 2: Process URLs
    logger.info('🔄 Step 2: Processing individual tools...');
    const tools = await processToolUrls(toolUrls);
    
    // Step 3: Save to Firestore
    logger.info('💾 Step 3: Saving to Firestore...');
    const savedCount = await saveScrapedTools(tools);
    
    logger.info(`✅ Manual scraping completed. Found ${toolUrls.length} URLs, processed ${tools.length} tools, saved ${savedCount} new tools.`);
    
    return {
      success: true,
      urlsFound: toolUrls.length,
      toolsProcessed: tools.length,
      savedCount: savedCount,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    logger.error('❌ Error in manual Product Hunt scraping:', error);
    throw new HttpsError('internal', 'Scraping failed: ' + error.message);
  }
});

/**
 * Submits a new tool with automatic screenshot capture
 */
exports.submitTool = onCall(async (request) => {
  if (!db) {
    logger.error("Firebase Admin SDK not initialized.");
    throw new HttpsError(
      "internal",
      "Server configuration error. Please try again later."
    );
  }

  const { 
    name, 
    tagline, 
    description, 
    websiteUrl, 
    categories, 
    tags, 
    platforms, 
    pricingModel, 
    pricingDetails, 
    features, 
    useCases, 
    integrations, 
    targetAudience, 
    submitterEmail 
  } = request.data;

  // Basic validation
  if (!name || !tagline || !websiteUrl || !categories || categories.length === 0) {
    throw new HttpsError(
      "invalid-argument",
      "Missing required fields: name, tagline, websiteUrl, and at least one category."
    );
  }

  // Validate URL format
  try {
    new URL(websiteUrl);
  } catch (error) {
    throw new HttpsError(
      "invalid-argument",
      "Invalid website URL format."
    );
  }

  const slug = generateSlug(name);
  if (!slug) {
    throw new HttpsError(
      "invalid-argument",
      "Tool name cannot be empty or contain only special characters."
    );
  }

  try {
    // First, create the tool document
    const toolData = {
      name,
      tagline,
      description: description || '',
      websiteUrl,
      logoUrl: '', // Will be populated with screenshot
      screenshotUrl: '', // Will be populated after screenshot
      categories: categories || [],
      tags: tags || [],
      platforms: platforms || [],
      pricingModel: pricingModel || '',
      pricingDetails: pricingDetails || '',
      features: features || [],
      useCases: useCases || [],
      integrations: integrations || [],
      targetAudience: targetAudience || [],
      submitterEmail: submitterEmail || '',
      slug,
      status: 'pending',
      isFeatured: false,
      submittedByUID: request.auth ? request.auth.uid : null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      upvotesCount: 0,
      viewsCount: 0,
      commentsCount: 0,
      source: 'free_submission'
    };

    // Save tool to Firestore
    const toolRef = await db.collection('tools').add(toolData);
    const toolId = toolRef.id;

    logger.info(`Tool created with ID: ${toolId}`);

    // Take screenshot in the background (don't wait for it to complete)
    takeScreenshot(websiteUrl, toolId).then(async (screenshotUrl) => {
      if (screenshotUrl) {
        try {
          // Update the tool with screenshot URL
          await toolRef.update({
            screenshotUrl: screenshotUrl,
            logoUrl: screenshotUrl, // Use screenshot as logo too
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          logger.info(`Tool ${toolId} updated with screenshot: ${screenshotUrl}`);
        } catch (updateError) {
          logger.error(`Error updating tool ${toolId} with screenshot:`, updateError);
        }
      } else {
        logger.warn(`No screenshot generated for tool ${toolId}`);
      }
    }).catch((screenshotError) => {
      logger.error(`Screenshot process failed for tool ${toolId}:`, screenshotError);
    });

    return { 
      success: true, 
      toolId: toolId,
      message: 'Tool submitted successfully! We\'ll review it shortly and generate a preview.' 
    };

  } catch (error) {
    logger.error("Error submitting tool:", error);
    throw new HttpsError(
      "internal",
      "Failed to submit tool. Please try again."
    );
  }
});

/**
 * Creates a Stripe Checkout session for featuring a tool.
 */
exports.createCheckoutSession = onCall(async (request) => {
  const { toolId, amount, userEmail } = request.data;
  let stripe;
  
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    
    if (!db) {
      logger.error("Firebase Admin SDK not initialized.");
      throw new HttpsError("internal", "Server configuration error. Please try again later.");
    }

    if (!toolId || !amount || amount < 19 || amount > 5000) {
      throw new HttpsError("invalid-argument", "Invalid tool ID or amount.");
    }

    const toolDoc = await db.collection("tools").doc(toolId).get();
    if (!toolDoc.exists) {
      throw new HttpsError("not-found", "Tool not found.");
    }
    const toolData = toolDoc.data();

    let stripeCustomerId = null;
    
    // Create Stripe customer if email provided
    if (userEmail) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { toolId: toolId }
      });
      stripeCustomerId = customer.id;
      logger.info(`Created Stripe customer ${stripeCustomerId} for tool ${toolId}`);
    }

    // Create Checkout Session
    const sessionData = {
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Feature Tool: ${toolData.name}`,
              description: `Boost ${toolData.name} ranking for 1 year`,
              images: [toolData.logoUrl || "https://toolslash.com/default-logo.png"],
            },
            unit_amount: amount * 100, // Stripe expects amount in cents
          },
          quantity: 1,
        },
      ],
      success_url: process.env.STRIPE_SUCCESS_URL || `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&tool_id=${toolId}`,
      cancel_url: process.env.STRIPE_CANCEL_URL || `${process.env.FRONTEND_URL}/payment-cancel?tool_id=${toolId}`,
      metadata: {
        toolId: toolId,
        featuredPrice: amount.toString(),
        toolName: toolData.name,
      },
      billing_address_collection: "required",
    };

    // Only add customer if we have a valid customer ID
    if (stripeCustomerId) {
      sessionData.customer = stripeCustomerId;
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    logger.info(`Created Stripe Checkout session ${session.id} for tool ${toolId}.`);
    logger.info(`Returning sessionId: ${session.id}`);
    
    return { sessionId: session.id };
    
  } catch (error) {
    logger.error(`Error creating Stripe Checkout session for tool ${toolId}:`, error);
    throw new HttpsError('internal', `Failed to create checkout session: ${error.message}`);
  }
});

/**
 * Stripe webhook handler to update tool when payment is successful.
 */
exports.stripeWebhook = onRequest(async (req, res) => {
  let stripe;
  
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  } catch (error) {
    logger.error("Error initializing Stripe for webhook:", error);
    return res.status(500).send("Stripe configuration error.");
  }
  
  if (!db) {
    logger.error("Firebase Admin SDK not initialized for webhook.");
    return res.status(500).send("Server configuration error.");
  }
  
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!endpointSecret) {
    logger.error("STRIPE_WEBHOOK_SECRET environment variable is not set!");
    return res.status(400).send("Stripe webhook secret is not configured.");
  }
  
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    logger.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const { toolId, featuredPrice } = session.metadata;

      if (!toolId || !featuredPrice) {
        logger.error("Missing metadata in session:", session.id);
        return res.status(400).send("Missing metadata in session.");
      }

      const expirationDate = new Date();
      expirationDate.setFullYear(expirationDate.getFullYear() + 1);

      const toolRef = db.collection("tools").doc(toolId);
      await toolRef.update({
        isFeatured: true,
        featuredPrice: parseInt(featuredPrice),
        featuredPaidAt: admin.firestore.FieldValue.serverTimestamp(),
        featuredExpiresAt: expirationDate,
        featuredPaymentId: session.payment_intent,
        featuredSessionId: session.id,
        featuredCustomerEmail: session.customer_details?.email || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Tool ${toolId} successfully featured for $${featuredPrice}. Payment ID: ${session.payment_intent}`);

    } catch (error) {
      logger.error("Error updating tool to featured:", error);
      return res.status(500).send("Internal server error while updating tool.");
    }
  }

  res.status(200).json({ received: true });
});

/**
 * One-time function to add slugs to existing tools without them
 */
exports.addMissingSlugs = onCall(async (request) => {
  try {
    const toolsRef = admin.firestore().collection('tools');
    const snapshot = await toolsRef.get();
    
    let updatedCount = 0;
    const batch = admin.firestore().batch();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (!data.slug && data.name) {
        const slug = generateSlug(data.name);
        if (slug) {
          batch.update(doc.ref, { slug: slug });
          updatedCount++;
          logger.info(`Adding slug "${slug}" to tool: ${data.name}`);
        }
      }
    });
    
    if (updatedCount > 0) {
      await batch.commit();
      logger.info(`✅ Updated ${updatedCount} tools with missing slugs`);
    }
    
    return {
      success: true,
      updated: updatedCount,
      message: `Updated ${updatedCount} tools with missing slugs`
    };
    
  } catch (error) {
    logger.error('Error adding missing slugs:', error);
    throw new HttpsError('internal', 'Failed to add missing slugs: ' + error.message);
  }
});

exports.generateSitemap = functions.https.onRequest(async (req, res) => {
  try {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Content-Type', 'application/xml');

    const baseUrl = 'https://toolslash.com';
    
    // Get all approved/verified tools from Firestore (including old tools without status)
    const toolsSnapshot = await admin.firestore()
      .collection('tools')
      .get();
    
    // Filter tools on client side to include approved, verified, or old tools without status
    const validTools = [];
    toolsSnapshot.forEach(doc => {
      const tool = doc.data();
      // Include if: status is approved/verified, OR no status field (old tools), OR has a slug (published)
      if (tool.status === 'approved' || tool.status === 'verified' || !tool.status || tool.slug) {
        validTools.push({ id: doc.id, ...tool });
      }
    });

    // Get unique categories
    const categoriesSet = new Set();
    validTools.forEach(tool => {
      if (tool.categories) {
        tool.categories.forEach(cat => categoriesSet.add(cat));
      }
    });
    
    // Get actual search terms from Firestore that have been searched
    let actualSearchTerms = [];
    try {
      const searchTermsSnapshot = await admin.firestore()
        .collection('searchTerms')
        .where('searchCount', '>=', 2) // Only include terms searched at least twice
        .orderBy('searchCount', 'desc')
        .limit(30) // Limit to top 30 most popular search terms
        .get();
        
      actualSearchTerms = searchTermsSnapshot.docs.map(doc => doc.data().term);
    } catch (error) {
      console.error('Error fetching search terms:', error);
      // Fallback to manual popular terms if Firestore fails
      actualSearchTerms = [
        'ai tools', 'project management', 'design software', 'analytics', 
        'marketing automation', 'productivity', 'collaboration',
        'design tools', 'development tools', 'ai', 'automation'
      ];
    }

    // Generate XML sitemap
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>
  
  <url>
    <loc>${baseUrl}/browse</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/submit-tool</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  
  <url>
    <loc>${baseUrl}/search</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>
  
`;

    // Add category pages
    Array.from(categoriesSet).forEach(category => {
      const encodedCategory = encodeURIComponent(category);
      sitemap += `  <url>
    <loc>${baseUrl}/category/${encodedCategory}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  
`;
    });

    // Add search pages for actual searched terms
    actualSearchTerms.forEach(searchTerm => {
      const encodedTerm = encodeURIComponent(searchTerm);
      sitemap += `  <url>
    <loc>${baseUrl}/search/${encodedTerm}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>
  
`;
    });

    // Add tool pages
    validTools.forEach(tool => {
      // Only add tools that have slugs
      if (tool.slug) {
        const lastMod = tool.updatedAt ? tool.updatedAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        
        sitemap += `  <url>
    <loc>${baseUrl}/tool/${tool.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
    <lastmod>${lastMod}</lastmod>
  </url>
  
`;
      }
    });

    sitemap += `</urlset>`;

    res.send(sitemap);
    
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://toolslash.web.app</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
  }
});

/**
 * Takes a screenshot of a website and returns the URL
 */
exports.takeScreenshot = onCall(async (request) => {
  const { url, toolId } = request.data;

  if (!url || !toolId) {
    throw new HttpsError('invalid-argument', 'URL and toolId are required');
  }

  try {
    logger.info(`Taking screenshot for tool ${toolId} at URL: ${url}`);
    
    const screenshotUrl = await takeScreenshot(url, toolId);
    
    if (!screenshotUrl) {
      throw new HttpsError('internal', 'Failed to generate screenshot');
    }

    logger.info(`Screenshot successful for tool ${toolId}: ${screenshotUrl}`);
    
    return {
      success: true,
      screenshotUrl: screenshotUrl
    };

  } catch (error) {
    logger.error(`Screenshot error for tool ${toolId}:`, error);
    throw new HttpsError('internal', 'Screenshot generation failed: ' + error.message);
  }
}); 