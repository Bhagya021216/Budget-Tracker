// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
  themeToggle.classList.toggle('active');
  if (themeToggle.classList.contains('active')) {
    body.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  } else {
    body.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  }
});

// Load theme
if (localStorage.getItem('theme') === 'dark') {
  themeToggle.classList.add('active');
  body.setAttribute('data-theme', 'dark');
}

// Tab Switching
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;

    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    tabContents.forEach(content => {
      content.style.display = 'none';
      content.classList.remove('active');
    });

    const targetContent = document.getElementById(target + 'Section');
    targetContent.style.display = 'block';
    setTimeout(() => targetContent.classList.add('active'), 10);
  });
});

// Transaction Management
class TransactionManager {
  constructor(type) {
    this.type = type;
    this.transactions = this.loadTransactions();
    this.initElements();
    this.updateStats();
    this.renderTransactions();
  }

  initElements() {
    this.descInput = document.getElementById(`${this.type}Desc`);
    this.amountInput = document.getElementById(`${this.type}Amount`);
    this.typeBtn = document.getElementById(`${this.type}TypeBtn`);
    this.addBtn = document.getElementById(`${this.type}AddBtn`);
    this.clearBtn = document.getElementById(`${this.type}ClearBtn`);
    this.exportBtn = document.getElementById(`${this.type}ExportBtn`);
    this.summaryBtn = document.getElementById(`${this.type}SummaryBtn`);
    this.list = document.getElementById(`${this.type}List`);

    this.isIncome = true;

    this.typeBtn.addEventListener('click', () => this.toggleType());
    this.addBtn.addEventListener('click', () => this.addTransaction());
    this.clearBtn.addEventListener('click', () => this.clearMonth());
    this.exportBtn.addEventListener('click', () => this.exportCSV());
    this.summaryBtn.addEventListener('click', () => this.showSummary());

    // Enter key support
    this.descInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTransaction();
    });
    this.amountInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTransaction();
    });
  }

  toggleType() {
    this.isIncome = !this.isIncome;
    this.typeBtn.classList.toggle('active');
    this.typeBtn.textContent = this.isIncome ? '+ Income' : '- Expense';
    if (this.type === 'business') {
      this.typeBtn.textContent = this.isIncome ? '+ Revenue' : '- Cost';
    }
  }

  addTransaction() {
    const desc = this.descInput.value.trim();
    const amount = parseFloat(this.amountInput.value);

    if (!desc || isNaN(amount) || amount <= 0) {
      this.showActionModal('Invalid Input', 'Please enter valid description and amount.', 'error');
      return;
    }

    const transaction = {
      id: Date.now(),
      desc,
      amount,
      type: this.isIncome ? 'income' : 'expense',
      date: new Date().toLocaleDateString('en-GB')
    };

    this.transactions.push(transaction);
    this.saveTransactions();
    this.updateStats();
    this.renderTransactions();
    this.clearInputs();
    this.showActionModal('Transaction Added', 'The transaction has been successfully added.', 'success');
  }

  editTransaction(id) {
    const transaction = this.transactions.find(t => t.id === id);
    if (!transaction) return;

    const newDesc = prompt('Edit description:', transaction.desc);
    const newAmount = parseFloat(prompt('Edit amount:', transaction.amount));

    if (newDesc && !isNaN(newAmount) && newAmount > 0) {
      transaction.desc = newDesc.trim();
      transaction.amount = newAmount;
      this.saveTransactions();
      this.updateStats();
      this.renderTransactions();
      this.showActionModal('Transaction Updated', 'The transaction has been successfully updated.', 'success');
    } else {
      this.showActionModal('Update Failed', 'Please enter valid description and amount.', 'error');
    }
  }

  deleteTransaction(id) {
    if (confirm('Delete this transaction?')) {
      this.transactions = this.transactions.filter(t => t.id !== id);
      this.saveTransactions();
      this.updateStats();
      this.renderTransactions();
      this.showActionModal('Transaction Deleted', 'The transaction has been successfully deleted.', 'success');
    }
  }

  clearMonth() {
    if (confirm('Clear all transactions for this month? This cannot be undone.')) {
      this.transactions = [];
      this.saveTransactions();
      this.updateStats();
      this.renderTransactions();
      this.showActionModal('Transactions Cleared', 'All transactions for this month have been cleared.', 'success');
    }
  }

  updateStats() {
    const income = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expense = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expense;

    document.getElementById(`${this.type}Income`).textContent = `RS ${income.toFixed(2)}`;
    document.getElementById(`${this.type}Expense`).textContent = `RS ${expense.toFixed(2)}`;
    document.getElementById(`${this.type}Balance`).textContent = `RS ${balance.toFixed(2)}`;

    const balanceCard = document.getElementById(`${this.type}BalanceCard`);
    balanceCard.classList.remove('profit', 'loss');
    if (balance >= 0) {
      balanceCard.classList.add('profit');
    } else {
      balanceCard.classList.add('loss');
    }
  }

  renderTransactions() {
    if (this.transactions.length === 0) {
      this.list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <p>No transactions yet. Add your first one!</p>
        </div>
      `;
      return;
    }

    const html = this.transactions.map(t => `
      <div class="transaction-item">
        <div class="transaction-info">
          <div class="transaction-desc">${t.desc}</div>
          <div class="transaction-date">${t.date}</div>
        </div>
        <div class="transaction-amount ${t.type}">
          ${t.type === 'income' ? '+' : '-'}RS ${t.amount.toFixed(2)}
        </div>
        <div class="transaction-actions">
          <button class="btn btn-small btn-primary" onclick="${this.type}Manager.editTransaction(${t.id})">Edit</button>
          <button class="btn btn-small btn-danger" onclick="${this.type}Manager.deleteTransaction(${t.id})">Delete</button>
        </div>
      </div>
    `).join('');

    this.list.innerHTML = html;
  }

  clearInputs() {
    this.descInput.value = '';
    this.amountInput.value = '';
    this.descInput.focus();
  }

  exportCSV() {
    if (this.transactions.length === 0) {
      this.showActionModal('Export Failed', 'No transactions to export.', 'error');
      return;
    }

    const incomes = this.transactions.filter(t => t.type === 'income');
    const expenses = this.transactions.filter(t => t.type === 'expense');

    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    let csvContent = `${this.type.toUpperCase()} TRANSACTIONS SUMMARY\n\n`;

    // Income Section
    csvContent += 'INCOME TRANSACTIONS\n';
    csvContent += 'Date,Description,Amount (RS)\n';
    incomes.forEach(t => {
      csvContent += `${t.date},"${t.desc}",${t.amount.toFixed(2)}\n`;
    });
    csvContent += `,"TOTAL INCOME",${totalIncome.toFixed(2)}\n\n`;

    // Expense Section
    csvContent += 'EXPENSE TRANSACTIONS\n';
    csvContent += 'Date,Description,Amount (RS)\n';
    expenses.forEach(t => {
      csvContent += `${t.date},"${t.desc}",${t.amount.toFixed(2)}\n`;
    });
    csvContent += `,"TOTAL EXPENSES",${totalExpense.toFixed(2)}\n\n`;

    // Balance Summary
    csvContent += 'BALANCE SUMMARY\n';
    csvContent += `,"Total Income",${totalIncome.toFixed(2)}\n`;
    csvContent += `,"Total Expenses",${totalExpense.toFixed(2)}\n`;
    csvContent += `,"Net ${balance >= 0 ? 'Profit' : 'Loss'}",${Math.abs(balance).toFixed(2)}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.type}_transactions_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
    this.showActionModal('Export Successful', 'CSV file has been downloaded.', 'success');
  }

  showSummary() {
    const income = this.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = this.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    const count = this.transactions.length;

    const summaryHTML = `
      <p><strong>Total Transactions:</strong> ${count}</p>
      <div class="summary-grid">
        <div class="summary-item">
          <div>Total Income</div>
          <div class="summary-value" style="color: var(--success)">RS ${income.toFixed(2)}</div>
        </div>
        <div class="summary-item">
          <div>Total Expense</div>
          <div class="summary-value" style="color: var(--danger)">RS ${expense.toFixed(2)}</div>
        </div>
      </div>
      <div class="summary-item ${balance >= 0 ? 'profit' : 'loss'}" style="margin-top: 15px; grid-column: span 2;">
        <div>Net ${balance >= 0 ? 'Profit' : 'Loss'}</div>
        <div class="summary-value" style="color: ${balance >= 0 ? 'var(--success)' : 'var(--danger)'}">
          RS ${Math.abs(balance).toFixed(2)}
        </div>
      </div>
    `;

    document.getElementById('summaryContent').innerHTML = summaryHTML;
    document.getElementById('summaryModal').classList.add('active');
  }

  loadTransactions() {
    const data = localStorage.getItem(`${this.type}Transactions`);
    return data ? JSON.parse(data) : [];
  }

  saveTransactions() {
    localStorage.setItem(`${this.type}Transactions`, JSON.stringify(this.transactions));
  }

  showActionModal(title, message, type) {
    const modal = document.getElementById('actionModal');
    const titleEl = document.getElementById('actionTitle');
    const contentEl = document.getElementById('actionContent');

    titleEl.textContent = title;
    contentEl.innerHTML = `
      <div class="action-message ${type}">
        <div class="action-icon">${type === 'success' ? '✅' : '❌'}</div>
        <p>${message}</p>
      </div>
    `;

    modal.classList.add('active');

    // Auto-close after 3 seconds
    setTimeout(() => {
      modal.classList.remove('active');
    }, 3000);
  }
}

// Initialize managers
let personalManager, businessManager;

function initManagers() {
  personalManager = new TransactionManager('personal');
  businessManager = new TransactionManager('business');
}

// Compare Accounts
document.getElementById('businessCompareAccountsBtn').addEventListener('click', () => {
  const personalIncome = personalManager.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const personalExpense = personalManager.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const personalBalance = personalIncome - personalExpense;

  const businessIncome = businessManager.transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const businessExpense = businessManager.transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const businessBalance = businessIncome - businessExpense;

  const totalIncome = personalIncome + businessIncome;
  const totalExpense = personalExpense + businessExpense;
  const netProfit = totalIncome - totalExpense;

  const compareHTML = `
    <div style="text-align: center; margin-bottom: 20px;">
      <h3>Combined Financial Overview</h3>
    </div>
    <div class="summary-grid">
      <div class="summary-item">
        <div>Personal Balance</div>
        <div class="summary-value" style="color: ${personalBalance >= 0 ? 'var(--success)' : 'var(--danger)'}">
          RS ${Math.abs(personalBalance).toFixed(2)} ${personalBalance >= 0 ? 'Profit' : 'Loss'}
        </div>
      </div>
      <div class="summary-item">
        <div>Business Profit</div>
        <div class="summary-value" style="color: ${businessBalance >= 0 ? 'var(--success)' : 'var(--danger)'}">
          RS ${Math.abs(businessBalance).toFixed(2)} ${businessBalance >= 0 ? 'Profit' : 'Loss'}
        </div>
      </div>
      <div class="summary-item ${netProfit >= 0 ? 'profit' : 'loss'}" style="grid-column: span 2; margin-top: 15px;">
        <div>Total Net ${netProfit >= 0 ? 'Profit' : 'Loss'}</div>
        <div class="summary-value" style="color: ${netProfit >= 0 ? 'var(--success)' : 'var(--danger)'}">
          RS ${Math.abs(netProfit).toFixed(2)}
        </div>
      </div>
    </div>
  `;

  document.getElementById('compareContent').innerHTML = compareHTML;
  document.getElementById('compareModal').classList.add('active');
});

// Modal Close
document.querySelectorAll('.close-modal').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.modal').classList.remove('active');
  });
});

// Close modal on outside click
window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    e.target.classList.remove('active');
  }
});

// Initialize on load
window.addEventListener('load', initManagers);
