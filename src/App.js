import './App.css';
import { useState, useEffect, useCallback } from "react";

function App() {
  const [name, setName] = useState('');
  const [datetime, setDatetime] = useState('');
  const [description, setDescription] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [savingsGoal, setSavingsGoal] = useState('');
  const [showSavingsInput, setShowSavingsInput] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState(0);
  const [savingsInput, setSavingsInput] = useState('');
  //const [showUpdate, setShowUpdate] = useState(false);

  // Calculate total balance
  let totalBalance = 0;
  for (const transaction of transactions) {
    totalBalance += transaction.price;
  }

  // Calculate available balance (total minus savings)
  const availableBalance = totalBalance - savingsAmount;


  // Reset savings goal and update savings
  const resetSavingsGoal = useCallback(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    localStorage.removeItem(`goalReached-${monthKey}`);
  
    // Get the previous savings amount from localStorage (if any)
    const previousSavings = parseFloat(localStorage.getItem('savingsAmount')) || 0;
  
    // Get the current savings goal
    const goal = parseFloat(savingsGoal);
  
    // Accumulate the previous savings with the new goal
    const newSavingsAmount = previousSavings + (isNaN(goal) ? 0 : goal);
  
    // Set the updated savings amount in localStorage and state
    setSavingsAmount(newSavingsAmount);
    localStorage.setItem('savingsAmount', newSavingsAmount.toString());
  
    // Clear input fields and show the savings input form
    setShowSavingsInput(true);
    setSavingsGoal('');
    setSavingsInput('');
  }, [savingsGoal]);
  
  

  useEffect(() => {
    getTransactions().then(setTransactions);
    // Load savings amount from localStorage
    const savedSavings = localStorage.getItem('savingsAmount');
    if (savedSavings) {
      const amount = parseFloat(savedSavings);
      setSavingsAmount(amount);
      setSavingsInput(amount.toString());
    }
  }, []);

  // Check if month has changed
  useEffect(() => {
    const checkMonthChange = () => {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
      const lastMonthKey = localStorage.getItem('lastMonthKey');
      
      if (lastMonthKey && lastMonthKey !== monthKey) {
        // Month has changed, carry over remaining balance
        const lastMonthGoal = parseFloat(localStorage.getItem(`savingsGoal-${lastMonthKey}`)) || 0;
        const remainingBalance = Math.max(0, lastMonthGoal - totalBalance);
        
        // Set new month's goal to remaining balance
        if (remainingBalance > 0) {
          setSavingsGoal(remainingBalance.toString());
          localStorage.setItem(`savingsGoal-${monthKey}`, remainingBalance.toString());
          setShowSavingsInput(false);
        } else {
          resetSavingsGoal();
        }
      }
      
      localStorage.setItem('lastMonthKey', monthKey);
    };

    checkMonthChange();
    // Check every hour for month change
    const interval = setInterval(checkMonthChange, 3600000);
    return () => clearInterval(interval);
  }, [totalBalance, resetSavingsGoal]);

  async function getTransactions() {
    const url = 'http://localhost:4040/api/transactions';
    const response = await fetch(url);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  function addNewTransaction(ev) {
    ev.preventDefault();
    if (!name || !description || !datetime) {
      alert('Please fill in all fields!');
      return;
    }
    const url = 'http://localhost:4040/api/transaction';

    const [priceStr, ...nameParts] = name.trim().split(' ');
    const price = Number(priceStr);
    const itemName = nameParts.join(' ');

    fetch(url, {
      method: 'POST',
      headers: { 'Content-type': 'application/json' },
      body: JSON.stringify({
        price,
        name: itemName,
        description,
        datetime,
      })
    }).then(response => {
      response.json().then(json => {
        setName('');
        setDescription('');
        setDatetime('');
        getTransactions().then(setTransactions);
        console.log('result', json);
      });
    });
  }

  function handleSavingsGoalSubmit(ev) {
    ev.preventDefault();
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    localStorage.setItem(`savingsGoal-${monthKey}`, savingsGoal);
    setShowSavingsInput(false);
  }

  // Parse savingsGoal as a number for comparison
  const savingsGoalNumber = parseFloat(savingsGoal) || 0;

  // Track if goal was ever reached this month
  useEffect(() => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
    const goalReachedKey = `goalReached-${monthKey}`;
    if (totalBalance >= savingsGoalNumber && savingsGoalNumber > 0) {
      localStorage.setItem(goalReachedKey, 'true');
    }
  }, [totalBalance, savingsGoal, savingsGoalNumber]);

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const goalReached = localStorage.getItem(`goalReached-${monthKey}`) === 'true';
  const isUsingSavings = goalReached && availableBalance < savingsGoalNumber && savingsGoalNumber > 0;

  return (
    <main>
      <div className="header-container">
      <h1>
  ₹ {availableBalance.toFixed(2)}
  <span className="balance-carryover">(Available Balance after Savings)</span>
</h1>

        <div className="savings-tracker">
          <h3>Money Saved</h3>
          <div className="savings-amount">₹ {savingsAmount.toFixed(2)}</div>
          <div className="savings-input">
            <input
              type="number"
              value={savingsInput}
              readOnly
              placeholder="Savings amount"
            />
          </div>
        </div>
      </div>
      {isUsingSavings && (
        <div className="alert-using-savings">
          <strong>Alert:</strong> You are using your savings this month!
        </div>
      )}
      {showSavingsInput ? (
        <form onSubmit={handleSavingsGoalSubmit}>
          <div className="savings-goal">
            <label htmlFor="savingsGoal">Monthly Savings Goal (₹):</label>
            <textarea
              id="savingsGoal"
              value={savingsGoal}
              onChange={ev => setSavingsGoal(ev.target.value)}
              placeholder="Enter your monthly savings goal"
              rows={2}
            />
            <button type="submit">Save Goal</button>
          </div>
        </form>
      ) : (
        <div className="savings-display">
          <strong>Your Savings Goal for this month:</strong> ₹{savingsGoal}
          <button onClick={resetSavingsGoal} className="reset-goal-btn">Reset Goal</button>
        </div>
      )}
      <form onSubmit={addNewTransaction}>
        <div className="basic">
          <input
            type="text"
            value={name}
            onChange={ev => setName(ev.target.value)}
            placeholder={'+200 new samsung tv'}
          />
          <input
            value={datetime}
            onChange={ev => setDatetime(ev.target.value)}
            type="datetime-local"
          />
        </div>
        <div className="description">
          <input
            type="text"
            value={description}
            onChange={ev => setDescription(ev.target.value)}
            placeholder={'description'}
          />
        </div>
        <button type="submit">Add new transaction</button>
        {transactions.length}
      </form>
      <div className="transactions">
        {transactions.map(transaction => (
          <div className="transaction" key={transaction._id}>
            <div className="left">
              <div className="name">{transaction.name}</div>
              <div className="description">{transaction.description}</div>
            </div>
            <div className="right">
              <div className={`price ${transaction.price < 0 ? 'red' : 'green'}`}>
                {transaction.price < 0 ? '' : '+'}₹{Math.abs(transaction.price)}
              </div>
              <div className="datetime">
                {new Date(transaction.datetime).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}

export default App;