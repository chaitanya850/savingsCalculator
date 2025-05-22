import './App.css';
import { useState, useEffect } from "react";

function App() {
  const [name, setName] = useState('');
  const [datetime, setDatetime] = useState('');
  const [description, setDescription] = useState('');
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    getTransactions().then(setTransactions);
  }, []);

  async function getTransactions() {
    const url = 'http://localhost:4040/api/transactions';
    const response = await fetch(url);
    return await response.json();
  }

  function addNewTransaction(ev) {
    ev.preventDefault();
    if (!name || !description || !datetime) {
      alert('Please fill in all fields!');
      return;
    }
    const url = 'http://localhost:4040/api/transaction';

    // Extract price and name
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
        getTransactions().then(setTransactions); // Refresh list
        console.log('result', json);
      });
    });
  }

  let balance = 0;
  for (const transaction of transactions) {
    balance += transaction.price;
  }

  return (
    <main>
      <h1>₹ {balance.toFixed(2)}</h1>
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
        <div className={`price ₹ {transaction.price < 0 ? 'red' : 'green'}`}>
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