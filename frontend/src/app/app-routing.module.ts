import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { NewsArticleComponent } from './components/news/article/news-article.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'news/:id', component: NewsArticleComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
