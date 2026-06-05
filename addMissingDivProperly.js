const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const target = `                          </button>
                        </div>
                      </div>
                    </div>
                  )`;

const replacement = `                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )`;

content = content.replace(target, replacement);

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Added missing div properly');
