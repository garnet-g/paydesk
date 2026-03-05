const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = path.join(__dirname, 'src', 'app', 'dashboard');

// Terms to replace
const TERMS_REPLACEMENTS = [
    ['Command center for student personnel by division', 'Manage student profiles, enrollment, and records'],
    ['Command Center', 'Dashboard'],
    ['ENROLLMENT LOCKED', 'LIMIT REACHED'],
    ['Enroll New Cadet', 'Add Student'],
    ['Cadets', 'Students'],
    ['Division Sector', 'Division'],
    ['View Personnel', 'View Students'],
    ['ALL PERSONNEL', 'ALL STUDENTS'],
    ['Syncing Sector Personnel...', 'Loading students...'],
    ['No personnel matching your reconnaissance parameters were located in this division.', 'No students matching your search criteria were found in this division.'],
    ['reconnaissance parameters', 'search criteria'],
    ['Central Intelligence Unit', ''],
    ['PURGE RECORD', 'DELETE'],
    ['Student record purged from system', 'Student deleted successfully'],
    ['Error during purge operation', 'Error deleting student'],
    ['Intelligence report exported successfully', 'Report exported successfully'],
    ['Strategic Intelligence', 'Reports Overview'],
    ['Collection Velocity Intelligence', 'Collection Velocity'],
    ['Intelligence Stream', 'Revenue Stream'],
    ['Growth Matrix', 'Growth Trends'],
    ['Sector Metrics', 'Class Metrics'],
    ['cls.stream} Sector', 'cls.stream} Stream'],
    ['Encrypted Strategic intelligence Layer', 'Secure Analytics'],
    ['Disseminating critical intelligence to Institutional Channels', 'Sending messages to Institutional Channels'],
    ['Contact command to upgrade your sector access.', 'Please upgrade your plan to access this feature.'],
    ['Target Sector (Recipients)', 'Target Recipients'],
    ['Only future deployments will be influenced.', 'Only future invoices will be affected.'],
    ['Scouring Sector:', ''],
    ['Displaying Sector', 'Displaying'],
    ['Sector Personnel', 'Students'],
    ['Division Empty', 'No Students Found'],
    ['Syncing Sector Personnel', 'Loading students'],
];

// Tailwind classes to tone down
const CLASSES_TO_TONE_DOWN = [
    [/font-black/g, 'font-semibold'],
    [/\buppercase\b/g, ''],
    [/\btracking-widest\b/g, ''],
    [/\btracking-tighter\b/g, 'tracking-tight'],
    [/\bitalic\b/g, ''],
    [/\btracking-\[0\.[0-9]+em\]\b/g, '']
];

function processFile(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Replace robotic terms
        TERMS_REPLACEMENTS.forEach(([search, replace]) => {
            content = content.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
        });

        // Tone down styles
        CLASSES_TO_TONE_DOWN.forEach(([regex, replace]) => {
            content = content.replace(regex, replace);
        });

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Processed: ${filePath}`);
        }
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else {
            processFile(fullPath);
        }
    }
}

traverseDir(DASHBOARD_DIR);
console.log('Done mapping premium styling!');
