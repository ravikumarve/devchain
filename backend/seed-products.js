const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = 'devchain-files';

// Sample products data
const sampleProducts = [
  {
    title: 'React Dashboard Kit',
    description: 'A modern, responsive dashboard component library built with React 18 and TypeScript. Includes beautiful dark mode UI components, fully responsive design, optimized performance, and easy customization.',
    price: 29.99,
    category: 'react-components',
    tags: ['react', 'dashboard', 'typescript', 'ui', 'components'],
    techStack: ['React 18', 'TypeScript', 'CSS3'],
    sourceDir: '/tmp/devchain-sample-products/react-dashboard-kit',
    mainFile: 'components.tsx'
  },
  {
    title: 'Node.js API Starter',
    description: 'A production-ready Node.js API boilerplate with Express, TypeScript, and best practices. Features JWT authentication, OpenAPI/Swagger documentation, Jest testing setup, request validation with Joi, and ready for deployment.',
    price: 19.99,
    category: 'node-packages',
    tags: ['nodejs', 'express', 'api', 'boilerplate', 'typescript'],
    techStack: ['Node.js', 'Express', 'TypeScript'],
    sourceDir: '/tmp/devchain-sample-products/node-api-starter',
    mainFile: 'server.js'
  },
  {
    title: 'Python Automation Scripts',
    description: 'A collection of useful Python automation scripts for developers. Includes file organization automation, data processing utilities, task scheduling, text processing tools, and web scraping helpers.',
    price: 14.99,
    category: 'python-scripts',
    tags: ['python', 'automation', 'scripts', 'tools', 'productivity'],
    techStack: ['Python 3.7+'],
    sourceDir: '/tmp/devchain-sample-products/python-automation-scripts',
    mainFile: 'file_organizer.py'
  }
];

// Upload file to Supabase
async function uploadToSupabase(filePath, storagePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuffer, {
      contentType: 'text/plain',
      upsert: true
    });

  if (error) {
    throw error;
  }

  return `${BUCKET}/${storagePath}`;
}

// Main seeding function
async function seedProducts() {
  try {
    console.log('🌱 Starting product seeding...');

    // Create or get seller user
    let seller = await prisma.user.findFirst({
      where: { username: 'demostore' }
    });

    if (!seller) {
      seller = await prisma.user.create({
        data: {
          username: 'demostore',
          email: 'demo@devchain.com',
          passwordHash: '$2b$10$demo_hash_for_testing_only',
          bio: 'Official DevChain demo store featuring high-quality developer tools and resources.',
          reputationScore: 100
        }
      });
      console.log('✅ Created demo seller user');
    }

    // Process each product
    for (const productData of sampleProducts) {
      console.log(`\n📦 Processing: ${productData.title}`);

      // Upload main file to Supabase
      const mainFilePath = path.join(productData.sourceDir, productData.mainFile);
      const timestamp = Date.now();
      const storagePath = `products/demo/${timestamp}-${productData.mainFile}`;
      const fileUrl = await uploadToSupabase(mainFilePath, storagePath);
      console.log('  ✅ Uploaded main file to Supabase Storage');

      // Create product in database
      const product = await prisma.product.create({
        data: {
          title: productData.title,
          description: productData.description,
          price: productData.price,
          category: productData.category,
          tags: productData.tags,
          sellerId: seller.id,
          fileUrl,
          downloadsCount: Math.floor(Math.random() * 50) + 10, // Random initial sales
          isActive: true
        }
      });

      console.log(`  ✅ Created product with ID: ${product.id}`);
    }

    console.log('\n🎉 Product seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Created/updated seller: ${seller.username}`);
    console.log(`   - Total products: ${sampleProducts.length}`);
    console.log('\n💡 You can now test the purchase flow with these products!');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedProducts()
  .then(() => {
    console.log('\n✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  });
