const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const target = `                            onClick={() => openConsignmentDetailModal(consignment)}
                            className="btn w-100"
                            style={{ backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', padding: '0.5rem', fontWeight: 600 }}
                          >
                            <FiPackage size={14} className="me-1" />
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )`;

const replacement = `                            onClick={() => openConsignmentDetailModal(consignment)}
                            className="btn w-100"
                            style={{ backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', padding: '0.5rem', fontWeight: 600 }}
                          >
                            <FiPackage size={14} className="me-1" />
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  )`;

content = content.replace(target, replacement);

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Fixed extra div syntax error');
