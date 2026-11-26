import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'add-expense',
    pathMatch: 'full',
  },
  {
    path: 'add-expense',
    loadComponent: () => import('./add-expense/add-expense.page').then(m => m.AddExpensePage),
  },
  {
    path: 'view-expenses',
    loadComponent: () => import('./view-expenses/view-expenses.page').then(m => m.ViewExpensesPage),
  },
];
