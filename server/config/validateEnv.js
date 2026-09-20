/**
 * Check the environment before the app tries to use it.
 *
 * The alternative is finding out at request time: a missing GEMINI_API_KEY
 * would otherwise surface as a 502 on someone's first match, and a missing
 * MONGO_URI as a connection error several frames deep. Both are far harder to
 * read than a line at startup naming the variable that is not set.
 */

// Without these the app cannot serve a single useful request.
const REQUIRED = [
  {
    name: 'MONGO_URI',
    hint: 'A MongoDB connection string, e.g. mongodb://127.0.0.1:27017/hirescope',
  },
  {
    name: 'GEMINI_API_KEY',
    hint: 'Get one free at https://aistudio.google.com/app/apikey',
  },
];

// These only disable a feature, so a warning is the right volume.
const OPTIONAL = [
  {
    names: ['ADZUNA_APP_ID', 'ADZUNA_APP_KEY'],
    feature: 'Job search ("Browse real openings")',
    hint: 'Free keys at https://developer.adzuna.com/',
  },
];

/**
 * Exits the process with status 1 if anything required is missing.
 */
function validateEnv() {
  const missing = REQUIRED.filter(({ name }) => {
    const value = process.env[name];
    return typeof value !== 'string' || value.trim().length === 0;
  });

  if (missing.length > 0) {
    console.error('\nCannot start HireScope API - required environment variables are missing:\n');
    missing.forEach(({ name, hint }) => {
      console.error(`  ${name} is not set`);
      console.error(`    ${hint}\n`);
    });
    console.error('Set them in server/.env (copy server/.env.example to start).\n');

    // Fail here rather than booting into a state where every request errors.
    process.exit(1);
  }

  OPTIONAL.forEach(({ names, feature, hint }) => {
    const unset = names.filter((name) => !process.env[name]);
    if (unset.length > 0) {
      console.warn(
        `${feature} is disabled: ${unset.join(' and ')} not set. ${hint}`
      );
    }
  });
}

module.exports = validateEnv;
