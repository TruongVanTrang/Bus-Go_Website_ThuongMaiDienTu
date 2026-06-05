const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const target = `                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (`;

const replacement = `                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            ) : (`;

content = content.replace(target, replacement);

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Fixed missing div for consignments');
