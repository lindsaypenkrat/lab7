
let type='force'; 
let airports;
let worldmap;
let edge;
let node;
let force;
let plot;
let projection;
let map;
let paths;

let height = 800;
    width  = 1000;

Promise.all([ // load multiple files
	d3.json('airports.json'),
	d3.json('world-110m.json')
]).then(data=>{ // or use destructuring :([airports, wordmap])=>{ ... 
	let airports = data[0]; // data1.csv
    let worldmap = data[1]; // data2.json

plot = d3.select('.chart').append('svg')
    .attr("viewBox", [0,0,width,height]);

let worldFeatures = topojson.feature(worldmap, worldmap.objects.countries);
projection = d3.geoMercator().fitExtent([[0,0], [width,height]], worldFeatures);      
let path = d3.geoPath().projection(projection);  


map = plot.selectAll("path")
        .data(worldFeatures)
        .join("path")
        .attr("d", path)
        .attr("opacity", 0);

paths= plot.append("path")
    .datum(topojson.mesh(worldmap, worldmap.objects.countries))
    .attr("d", path(worldFeatures))
    .attr('fill', '#566573')
    .attr('stroke', 'black')
    .attr("opacity", "0")
    .attr("class", "subunit-boundary");



const rScale = d3.scaleSqrt()
    .domain(d3.extent(airports.nodes,d=>d.passengers))
    .range([2,18]);


force = d3.forceSimulation(airports.nodes)
    .force("charge", d3.forceManyBody())
    .force("link", d3.forceLink(airports.links).distance(50))
    .force("center", d3.forceCenter().x(width/2).y(height/2))


drag = force => {
    function dragstarted(event) {
        if (!event.active) force.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }
    
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }
    
    function dragended(event) {
        if (!event.active) force.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
    
    return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
        .filter(event => type === "force");
    }; 


edge = plot.selectAll("line")
    .append("g")    
    .data(airports.links)
    .join("line")
    .style("stroke", "#ccc")
    .style("stroke-width", 1);

node = plot.append("g")
    .selectAll("circle")
    .data(airports.nodes)
    .join("circle")
    .attr("r", function(d) {
        return rScale(d.passengers);
    })
    .attr("fill", "#00b9f0")
    .call(drag(force));

node.append("title")
    .text(d=>d.name);

force.on("tick", function() {
    edge
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

    node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);
        });


d3.selectAll("input[name=type]").on("change", event => {
    console.log("hi");
    type = event.target.value;
    console.log(type);
    update();
});


});

function update(){

    if (type === "map"){

        force.stop();

        //setting positions of link and node  
        edge
          .transition()
          .duration(600)
          .attr("x1", function(d) {
            return projection([d.source.longitude, d.source.latitude])[0];
          })
          .attr("y1", function(d) {
            return projection([d.sourcelongitude, d.source.latitude])[1];
          })
          .attr("x2", function(d) {
            return projection([d.target.longitude, d.target.latitude])[0];
          })
          .attr("y2", function(d) {
            return projection([d.target.longitude, d.target.latitude])[1];
          });

       
        node
          .transition()
          .duration(600)
          .attr("cx", d => projection([d.longitude, d.latitude])[0])      
          .attr("cy", d => projection([d.longitude, d.latitude])[1]);


          map.transition(1200).attr("opacity", 1);
          paths.transition(1200).attr("opacity", 1);

     
    } else {

    
       force.alpha(1).restart();
              // set the map opacity to 0
       plot.selectAll("path").transition().duration(600).ease(d3.easeLinear)
        .attr("opacity", "0");
        
       
    }
};

