const fs = require('fs');
let content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const target1 = `              <div className="consignments-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">`;
const replacement1 = `              <div className="consignments-list row g-4 mt-2">`;

const target2 = `                    <div key={consignment.id} className={\`consignment-card \${consignment.isEdited ? 'edited-glow' : ''}\`} style={{ border: consignment.cargoStatus === 'cancelled' ? '2px solid #ef4444' : consignment.isEdited ? '2px solid #f59e0b' : '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1rem', }}>`;
const replacement2 = `                    <div key={consignment.id} className="col-12 col-md-6 col-lg-4">
                      <div className={\`consignment-card \${consignment.isEdited ? 'edited-glow' : ''}\`} style={{ border: consignment.cargoStatus === 'cancelled' ? '2px solid #ef4444' : consignment.isEdited ? '2px solid #f59e0b' : '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1rem', height: '100%' }}>`;

const target3 = `                          <button 
                            onClick={() => openConsignmentDetailModal(consignment)}
                            className="btn w-100"
                            style={{ backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', padding: '0.5rem', fontWeight: 600 }}
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  )`;
const replacement3 = `                          <button 
                            onClick={() => openConsignmentDetailModal(consignment)}
                            className="btn w-100"
                            style={{ backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', padding: '0.5rem', fontWeight: 600 }}
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  )`;

content = content.replace(target1, replacement1);
content = content.replace(target2, replacement2);
content = content.replace(target3, replacement3);

fs.writeFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', content, 'utf8');
console.log('Fixed UserHistory grid layout');
