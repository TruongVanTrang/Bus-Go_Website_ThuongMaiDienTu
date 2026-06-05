const fs = require('fs');
const content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const target = `                          </button>
                        </div>
                      </div>
                    </div>
                  )`;

const parts = content.split(target);
console.log('Occurrences:', parts.length - 1);
