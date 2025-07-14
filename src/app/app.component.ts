import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChartConfiguration, ChartData, ChartOptions, ChartType } from 'chart.js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  ativos = '';
  dataInicio = '';
  dataFim = '';
  loading = false;
  nenhumDado = false;

  chartData: ChartConfiguration<'line'>['data'] = {
    labels: [],
    datasets: []
  };

  chartType: ChartType = 'line';

  chartOptions: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          labelPointStyle: (context) => {
            const color = context.dataset.borderColor as string;
            return {
              pointStyle: 'circle', // pode ser 'circle', 'rect', 'triangle', etc.
              rotation: 0,
              backgroundColor: color // define a cor da bolinha
            };
          },
          labelColor: (context) => {
            const color = context.dataset.borderColor as string;
            return {
              borderColor: color,
              backgroundColor: color
            };
          }
        }
      },
      legend: {
        position: 'top',
        labels: {
          boxWidth: 20,
        }
      },
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 4,
        backgroundColor: 'blue' // cor default se quiser fixar
      }
    },
    scales: {
      x: {},
      y: {}
    }
  };

  ativosDisponiveis = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'BBAS3'];
  ativosSelecionados: string[] = [];

  erroValidacao = '';



  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  // consultar() {
  //   this.erroValidacao = '';
  //   if (!this.ativosSelecionados.length || !this.dataInicio || !this.dataFim || this.dataInicio > this.dataFim) {
  //     this.erroValidacao = 'Preencha corretamente os campos.';
  //     return;
  //   }
  //   const payload = {
  //     ativos: this.ativosSelecionados,
  //     dataInicio: this.dataInicio,
  //     dataFim: this.dataFim
  //   };
  //   this.http.post<any>('http://localhost:3000/api/quotes', payload).subscribe(res => {
  //     const labels = new Set<string>();
  //     const datasets = [];
  //     for (const ativo in res) {
  //       if (res[ativo].error) continue;
  //       const data = res[ativo];
  //       data.forEach((item: any) => labels.add(item.date));
  //       datasets.push({
  //         label: ativo,
  //         data: data.map((item: any) => item.close),
  //         fill: false,
  //         borderColor: this.getColorForSymbol(ativo),
  //         backgroundColor: this.getColorForSymbol(ativo),
  //         pointBackgroundColor: this.getColorForSymbol(ativo),
  //         tension: 0.1
  //       });
  //     }
  //     this.chartData = { labels: Array.from(labels), datasets };
  //     this.cdr.detectChanges();
  //   });
  // }

  consultar() {
    this.erroValidacao = '';
    this.nenhumDado = false;
    this.loading = true;
    this.chartData = { labels: [], datasets: [] };

    if (!this.ativosSelecionados.length || !this.dataInicio || !this.dataFim || this.dataInicio > this.dataFim) {
      this.erroValidacao = 'Preencha corretamente os campos.';
      this.loading = false;
      return;
    }

    const payload = {
      ativos: this.ativosSelecionados,
      dataInicio: this.dataInicio,
      dataFim: this.dataFim
    };

    this.http.post<any>('http://localhost:3000/api/quotes', payload).subscribe({
      next: (res) => {
        const labels = new Set<string>();
        const datasets = [];

        for (const ativo in res) {
          if (res[ativo].error) continue;
          const data = res[ativo];
          if (!data || !data.length) continue;

          data.forEach((item: any) => labels.add(item.date));

          datasets.push({
            label: ativo,
            data: data.map((item: any) => item.close),
            fill: false,
            borderColor: this.getColorForSymbol(ativo),
            backgroundColor: this.getColorForSymbol(ativo),
            pointBackgroundColor: this.getColorForSymbol(ativo),
            tension: 0.1
          });
        }

        if (!datasets.length) {
          this.nenhumDado = true;
        }

        this.chartData = { labels: Array.from(labels), datasets };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.erroValidacao = 'Erro ao consultar os dados. Tente novamente.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  getColorForSymbol(symbol: string): string {
    const colors = {
      PETR4: '#3A7CA5',
      VALE3: '#4CAF50',
      ITUB4: '#8E44AD',
      BBDC4: '#F39C12',
      default: '#7F8C8D'
    };
    return colors[symbol] || colors.default;
  }
}
