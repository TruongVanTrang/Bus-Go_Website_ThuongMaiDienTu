const fs = require('fs');
let content = fs.readFileSync('backend/server.js', 'utf8');

if (!content.includes("app.use('/uploads'")) {
  content = content.replace(
    "app.use(express.json({ limit: '50mb' }));", 
    "app.use(express.json({ limit: '50mb' }));\nconst path = require('path');\napp.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));"
  );
}

if (!content.includes("uploadRoutes")) {
  content = content.replace(
    "const adminRoutes = require('./routes/adminRoutes');",
    "const adminRoutes = require('./routes/adminRoutes');\nconst uploadRoutes = require('./routes/uploadRoutes');"
  );
  content = content.replace(
    "app.use('/api/admin', adminRoutes);",
    "app.use('/api/admin', adminRoutes);\napp.use('/api/upload', uploadRoutes);"
  );
}

fs.writeFileSync('backend/server.js', content, 'utf8');
console.log('Updated server.js');
