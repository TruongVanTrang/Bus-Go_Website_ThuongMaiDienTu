const fs = require('fs');
const content = fs.readFileSync('BusGo-Frontend/src/customer/pages/UserHistory.jsx', 'utf8');

const wrongTarget = `                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div style={{ fontSize: '3rem', }}>📋</div>`;

const parts = content.split(wrongTarget);
console.log('Occurrences of wrong target:', parts.length - 1);
