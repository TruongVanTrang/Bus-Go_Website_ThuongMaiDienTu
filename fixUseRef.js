const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', 'utf8');

content = content.replace(
  "import React, { useState, useEffect, useMemo } from 'react'",
  "import React, { useState, useEffect, useMemo, useRef } from 'react'"
);

fs.writeFileSync('BusGo-Frontend/src/driver/pages/DriverDashboard.jsx', content, 'utf8');
console.log('Added useRef import.');
