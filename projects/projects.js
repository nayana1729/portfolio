import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');
if (projectsTitle) {
  projectsTitle.textContent = `Projects (${projects.length})`;
}

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let query = '';
let selectedIndex = -1;
let searchInput = document.querySelector('.searchBar');

function renderPieChart(projectsGiven) {
  let rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let sliceGenerator = d3.pie().value((d) => d.value);
  let arcData = sliceGenerator(data);
  let arcs = arcData.map((d) => arcGenerator(d));

  let svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();

  arcs.forEach((arc, i) => {
    svg.append('path')
       .attr('d', arc)
       .attr('fill', colors(i))
       .attr('class', selectedIndex === i ? 'selected' : '')
       .on('click', () => {
         selectedIndex = selectedIndex === i ? -1 : i;
         svg.selectAll('path')
            .attr('class', (_, idx) => idx === selectedIndex ? 'selected' : '');
         d3.select('.legend')
           .selectAll('li')
           .attr('class', (_, idx) => 
             idx === selectedIndex ? 'legend-item selected' : 'legend-item'
           );

         let filteredBySearch = projects.filter((project) => {
           let values = Object.values(project).join('\n').toLowerCase();
           return values.includes(query.toLowerCase());
         });

         if (selectedIndex === -1) {
           renderProjects(filteredBySearch, projectsContainer, 'h2');
         } else {
           let selectedYear = data[selectedIndex].label;
           let filteredProjects = filteredBySearch.filter(
             (project) => project.year === selectedYear
           );
           renderProjects(filteredProjects, projectsContainer, 'h2');
         }
       });
  });

  let legend = d3.select('.legend');
  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

renderPieChart(projects);

searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  renderPieChart(filteredProjects);

  if (selectedIndex !== -1) {
    selectedIndex = -1;
  }

  renderProjects(filteredProjects, projectsContainer, 'h2');
});