import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatSelect, MatSelectChange } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { ChartConfiguration, ChartOptions, ChartType } from 'chart.js';
import { ptBR } from 'date-fns/locale';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  assets = '';
  startDate = '';
  endDate = '';
  loading = false;
  hasNoData = false;
  availableAssets = ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'BBAS3'];
  selectedAssets: string[] = [];
  allSelected = false;
  validationError = '';
  
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
          title: (items) => {
            const date = items[0].parsed.x;
            return new Date(date).toLocaleDateString('pt-BR');
          },
          labelPointStyle: (context) => {
            const color = context.dataset.borderColor as string;
            return {
              pointStyle: 'circle',
              rotation: 0,
              backgroundColor: color
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
        backgroundColor: 'blue'
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'dd/MM/yyyy'
          },
          tooltipFormat: 'dd/MM/yyyy'
        },
        adapters: {
          date: {
            locale: ptBR
          }
        }
      },
      y: {}
    }
  };




  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  allValue = '__ALL__';

  
  fetchQuotes() {
    this.validationError = '';
    this.hasNoData = false;
    this.loading = true;
    this.chartData = { labels: [], datasets: [] };

    if (!this.selectedAssets.length || !this.startDate  || !this.endDate || this.startDate  > this.endDate) {
      this.validationError = 'Preencha corretamente os campos.';
      this.loading = false;
      return;
    }

    const payload = {
      ativos: this.selectedAssets,
      dataInicio: this.startDate ,
      dataFim: this.endDate
    };

    this.http.post<any>('http://localhost:3000/api/quotes', payload).subscribe({
      next: (res) => {
        const labels = new Set<string>();
        const datasets = [];

        for (const asset in res) {
          if (res[asset].error) continue;
          const data = res[asset];
          if (!data || !data.length) continue;

          data.forEach((item: Quote) => labels.add(item.date));

          datasets.push({
            label: asset,
            data: data.map((item: Quote) => item.close),
            fill: false,
            borderColor: this.getColorForSymbol(asset),
            borderWidth: 1,
            backgroundColor: this.getColorForSymbol(asset),
            pointBackgroundColor: this.getColorForSymbol(asset),
            tension: 0.1
          });
        }

        if (!datasets.length) {
          this.hasNoData = true;
        }

        this.chartData = { labels: Array.from(labels), datasets };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.validationError = 'Erro ao consultar os dados. Tente novamente.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
  
  onSelectionChange(event: MatSelectChange) {
    const value = event.value;
    // Se veio o valor especial "Todos"
    if (value.includes(this.allValue)) {
      this.toggleAllSelection();
    } else {
      // Atualiza allSelected conforme o array atual
      this.allSelected =
        this.selectedAssets.length === this.availableAssets.length;
    }
  }
  
  private toggleAllSelection() {
    this.allSelected = !this.allSelected;
    if (this.allSelected) {
      this.selectedAssets = [...this.availableAssets];
    } else {
      this.selectedAssets = [];
    }
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

interface Quote { date: string; close: number }