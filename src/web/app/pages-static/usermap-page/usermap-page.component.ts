import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { feature } from 'topojson';

/**
 * Usermap page.
 */
@Component({
  selector: 'tm-usermap-page',
  templateUrl: './usermap-page.component.html',
  styleUrls: ['./usermap-page.component.scss'],
})
export class UsermapPageComponent implements OnInit {

  /**
   * The date in which the usermap is last updated.
   */
  lastUpdated: string = '';

  /**
   * The number of institutions.
   */
  nInstitutions: number = 0;

  /**
   * The number of countries.
   */
  nCountries: number = 0;

  constructor(private httpClient: HttpClient) {}

  ngOnInit(): void {
    this.httpClient.get('./assets/data/userMapData.json').subscribe((res: any) => {
      d3.json('./assets/data/worldTopo.json').then((world: any) => {
        this.lastUpdated = res.lastUpdated;
        this.nInstitutions = 0;
        const countryNames: string[] = Object.keys(res.institutes);
        for (const country of countryNames) {
          this.nInstitutions += res.institutes[country].length;
        }
        this.nCountries = countryNames.length;
        this.drawUsermap(res.institutes, world);
        d3.select(window).on('resize', () => this.drawUsermap(res.institutes, world));
      });
    });
  }

  /**
   * Draws the usermap.
   */
  drawUsermap(institutes: any, world: any): void {
    d3.select('#world-map').html('');
    const container: any = document.getElementById('world-map');
    const width: number = container.offsetWidth;
    const height: number = width / 2;
    const tooltip: any = d3.select('#world-map').append('div').attr('class', 'usermap-tooltip hidden');

    const projection: any = d3.geoMercator()
        .translate([(width / 2), (height / 2)])
        .scale(width / 2 / Math.PI);

    let g: any;

    const move: () => void = (): void => {
      const scale: number = d3.event.transform.k;
      const ht: number = height / 4;

      const tx: number = Math.min(
          (width / height) * (scale - 1),
          Math.max(width * (1 - scale), d3.event.transform.x),
      );
      const ty: number = Math.min(
          ht * (scale - 1) + ht * scale,
          Math.max(height * (1 - scale) - ht * scale, d3.event.transform.y),
      );
      const translate: number[] = [tx, ty];

      g.attr('transform', `translate(${translate})scale(${scale})`);
    };

    const zoom: any = d3.zoom()
        .scaleExtent([1, 16])
        .on('zoom', move);

    const svg: any = d3.select('#world-map').append('svg')
        .attr('width', width)
        .attr('height', height)
        .call(zoom)
        .append('g');

    g = svg.append('g');

    const countries: any = feature(world, world.objects.countries).features;
    const countryNames: string[] = Object.keys(institutes);
    g.selectAll('.country').data(countries)
        .enter().insert('path')
        .attr('class', 'usermap-country')
        .attr('d', d3.geoPath().projection(projection))
        .style('fill', (d: any) => countryNames.indexOf(d.properties.name) === -1 ? 'F2F2F2' : '428BCA')
        .on('mouseover', (event: any) => {
          const country: string = event.properties.name;
          if (!institutes[country]) {
            return;
          }
          const mouse: any = d3.mouse(svg.node()).map((d: any) => parseInt(d, 10));
          const offsetLeft: number = mouse[0] + container.offsetLeft + 20;
          const offsetTop: number = mouse[1] + container.offsetTop + 10;

          tooltip.classed('hidden', false)
              .attr('style', `left: ${offsetLeft}px; top: ${offsetTop}px;`)
              .html(`${country}: ${institutes[country].length} institutes`);
        })
        .on('mouseout', () => tooltip.classed('hidden', true));
  }

}
