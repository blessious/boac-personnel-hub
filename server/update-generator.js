const fs = require('fs');
const current = fs.readFileSync('prisma/schema.prisma', 'utf8');
const updated = current.replace('provider = "prisma-client-js"', 'provider = "prisma-client-js"\n  output   = "./generated/client"');
fs.writeFileSync('prisma/schema.prisma', updated);
