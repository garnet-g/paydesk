const fs = require('fs');
const filesToUpdate = [
    'src/app/api/dashboard/stats/route.ts',
    'src/app/api/payments/route.ts',
    'src/app/api/payments/[id]/route.ts',
    'src/app/api/invoices/route.ts',
    'src/app/api/invoices/[id]/items/route.ts',
    'src/app/api/invoices/bulk/route.ts',
    'src/app/api/reports/executive-summary/route.ts',
    'src/app/api/reports/collections/route.ts',
    'src/app/api/reports/defaulters/route.ts',
    'src/app/api/students/route.ts',
];

filesToUpdate.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // For dashboard/stats
    if (file.includes('stats/route.ts')) {
        content = content.replace("if (role === 'PRINCIPAL') {", "if (role === 'PRINCIPAL' || role === 'FINANCE_MANAGER') {");
    } else {
        // general replacement for others
        content = content.replace(
            "session.user.role !== 'PRINCIPAL'",
            "(session.user.role !== 'PRINCIPAL' && session.user.role !== 'FINANCE_MANAGER')"
        );
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
});
