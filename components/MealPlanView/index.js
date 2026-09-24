'use client';

import { useState } from 'react';
import { Flame, ChevronDown, ShoppingCart } from 'lucide-react';
import styles from './MealPlanView.module.css';

const MEAL_ORDER = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };

export default function MealPlanView({ plan }) {
  const [openDay, setOpenDay] = useState(1);

  if (!plan) return null;

  return (
    <div className={styles.wrap}>
      {plan.days.map((day) => {
        const meals = [...day.meals].sort((a, b) => (MEAL_ORDER[a.mealType] ?? 9) - (MEAL_ORDER[b.mealType] ?? 9));
        const dayCalories = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
        const isOpen = openDay === day.dayNumber;

        return (
          <div key={day.dayNumber} className={styles.day}>
            <button className={styles.dayHeader} onClick={() => setOpenDay(isOpen ? null : day.dayNumber)}>
              <span>Day {day.dayNumber}</span>
              <span className={styles.dayCalories}><Flame size={13} /> {dayCalories} kcal</span>
              <ChevronDown size={16} className={isOpen ? styles.chevronOpen : ''} />
            </button>

            {isOpen && (
              <div className={styles.meals}>
                {meals.map((meal, i) => (
                  <div key={i} className={styles.meal}>
                    <div className={styles.mealTop}>
                      <span className={styles.mealType}>{meal.mealType}</span>
                      <span className={styles.mealCalories}>{meal.calories} kcal</span>
                    </div>
                    <h4 className={styles.mealName}>{meal.name}</h4>
                    {meal.description && <p className={styles.mealDesc}>{meal.description}</p>}
                    <div className={styles.mealMacros}>
                      <span>{meal.protein}g P</span>
                      <span>{meal.carbs}g C</span>
                      <span>{meal.fat}g F</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {plan.shoppingList?.length > 0 && (
        <div className={styles.shoppingList}>
          <h3 className={styles.shoppingTitle}><ShoppingCart size={16} /> Shopping list</h3>
          <ul>
            {plan.shoppingList.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <button className={styles.saveToNotesBtn} onClick={async () => {
        const text = `AI Generated Diet Plan\n\n` + plan.days.map(d => `Day ${d.dayNumber}:\n` + d.meals.map(m => `- ${m.mealType}: ${m.name} (${m.calories} kcal)`).join('\n')).join('\n\n') + `\n\nShopping List:\n${plan.shoppingList?.join(', ')}`;
        const res = await fetch('/api/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: `Meal Plan ${new Date().toISOString().slice(0, 10)}`, content: text })
        });
        if (res.ok) window.appAlert('Awesome! Saved directly to your Notes.');
      }}>
        Save Plan to Notes
      </button>
    </div>
  );
}
