    var w = window.innerWidth/2.5;
    w = Math.max(w, 400)
    var h = w;

    var margin = {top: 50, right: 20, bottom: 70, left: 20};
    var pad = 80;
    var width = 2 * w + pad;

    var svg = d3.select('svg')
        .attr({
            'width': width + margin.left + margin.right,
            'height': h + margin.top + margin.bottom
        })
        .append('g')
        .attr({
            'transform': 'translate(' + margin.left + ',' + margin.top + ')',
            'width': width,
            'height': h
        });

    var scatterplot = svg.append('g')
        .attr({
            'id': 'scatterplot',
            'transform': 'translate(' + (w + pad) + ',0)'
        });

    var corrplot = svg.append('g')
        .attr({
            'id': 'corrplot'
        });

    corrplot.append('text')
        .text('Party Correlation')
        .attr({
            'class': 'plottitle',
            'x': w/2,
            'y': -margin.top/2,
            'dominant-baseline': 'middle',
            'text-anchor': 'middle'
        });

    scatterplot.append('text')
        .text('Party Scatter (click left bubbles)')
        .attr({
            'class': 'plottitle',
            'x': w/2,
            'y': -margin.top/2,
            'dominant-baseline': 'middle',
            'text-anchor': 'middle'
        });

    var corXscale = d3.scale.ordinal().rangeRoundBands([0,w]),
        corYscale = d3.scale.ordinal().rangeRoundBands([h,0]),
        corColScale = d3.scale.linear().domain([-0.2,0.3,1]).range(['red','yellow','green']);
    var corRscale = d3.scale.sqrt().domain([0,1]);

    d3.json('data/cov.json', function(err, data) {
        var nind = data.ind.length,
            nvar = data.vars.length;

        corXscale.domain(d3.range(nvar));
        corYscale.domain(d3.range(nvar));
        corRscale.range([0,0.4*corXscale.rangeBand()]);

        var corr = [];
        for (var i = 0; i < data.corr.length; ++i) {
            for (var j = 0; j < data.corr[i].length; ++j) {
                corr.push({row: i, col: j, value:data.corr[i][j]});
            }
        }

        var cells = corrplot.append('g')
            .attr('id', 'cells')
            .selectAll('empty')
            .data(corr)
            .enter().append('g')
            .attr({
                'class': 'cell'
            })
            .style('pointer-events', 'all');

        var rects = cells.append('rect')
            .attr({
                'x': function(d) { return corXscale(d.col); },
                'y': function(d) { return corXscale(d.row); },
                'width': corXscale.rangeBand(),
                'height': corYscale.rangeBand(),
                'fill': 'white',
                'stroke': 'none',
                'stroke-width': '1'
            });

        var circles = cells.append('circle')
            .attr('cx', function(d) {return corXscale(d.col) + 0.5*corXscale.rangeBand(); })
            .attr('cy', function(d) {return corXscale(d.row) + 0.5*corYscale.rangeBand(); })
            .attr('r', function(d) {return corRscale((d.value+0.2)); })
            .style('fill', function(d) {return (d.row === d.col) ? "rgb(167,167,167)" : corColScale(d.value); });

        corrplot.selectAll('g.cell')
            .on('mouseover', function(d) {
                drawScatter(d.col, d.row);
                d3.select(this)
                    .select('rect')
                    .attr('stroke', 'black');

                var xPos = parseFloat(d3.select(this).select('rect').attr('x'));
                var yPos = parseFloat(d3.select(this).select('rect').attr('y'));

                corrplot.append('text')
                    .attr({
                        'class': 'corrlabel',
                        'x': corXscale(d.col),
                        'y': h + margin.bottom*0.2
                    })
                    .text(data.vars[d.col])
                    .attr({
                        'dominant-baseline': 'middle',
                        'text-anchor': 'middle'
                    });

                corrplot.append('text')
                    .attr({
                        'class': 'corrlabel'
                        // 'x': -margin.left*0.1,
                        // 'y': corXscale(d.row)
                    })
                    .text(data.vars[d.row])
                    .attr({
                        'dominant-baseline': 'middle',
                        'text-anchor': 'middle',
                        'transform': 'translate(' + (-margin.left*0.1) + ',' + corXscale(d.row) + ')rotate(270)'
                    });

                corrplot.append('rect')
                    .attr({
                        'class': 'tooltip',
                        'x': xPos + 10,
                        'y': yPos - 30,
                        'width': 40,
                        'height': 20,
                        'fill': 'rgba(200, 200, 200, 0.5)',
                        'stroke': 'black'
                    });

                corrplot.append('text')
                    .attr({
                        'class': 'tooltip',
                        'x': xPos + 30,
                        'y': yPos - 15,
                        'text-anchor': 'middle',
                        'font-family': 'sans-serif',
                        'font-size': '14px',
                        'font-weight': 'bold',
                        'fill': 'black'
                    })
                    .text(d3.format('.2f')(d.value));
            })
            .on('mouseout', function(d) {
                d3.select('#corrtext').remove();
                d3.selectAll('.corrlabel').remove();
                d3.select(this)
                    .select('rect')
                    .attr('stroke', 'none');
                //Hide the tooltip
                d3.selectAll('.tooltip').remove();
            })

        var drawScatter = function(col, row) {
            console.log('column ' + col + ', row ' + row);

            d3.selectAll('.points').remove();
            d3.selectAll('.diag').remove();
            d3.selectAll('.axis').remove();
            d3.selectAll('.scatterlabel').remove();

            var xScale = d3.scale.linear()
                .domain(d3.extent(data.dat[col]))
                .range([0, w]);
            var yScale = d3.scale.linear()
                .domain(d3.extent(data.dat[row]))
                .range([h, 0]);

            var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient('bottom')
                .ticks(5);

            var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient('left');


            scatterplot.append("line")
                .attr("class","diag")
                .attr("x1", xScale(100))
                .attr("y1", yScale(100))
                .attr("x2", xScale(0))
                .attr("y2", yScale(0))
                .attr("stroke-width", 2)
                .attr("stroke", "red")
                .attr("stroke-dasharray", "5,5")  //style of svg-line
            ;

            scatterplot.append('g')
                .attr('class', 'points')
                .selectAll('empty')
                .data(d3.range(nind))
                .enter().append('text')
                .attr({
                    'class': 'tooltip',
                    'x': function(d) {
                        console.debug(d)
                        return xScale(data.dat[col][d]);
                    },
                    'y': function(d) {
                        return yScale(data.dat[row][d]);
                    },
                    'text-anchor': 'middle',
                    'font-family': 'sans-serif',
                    'font-size': '20px',
                    'font-weight': 'bold',
                    'fill': 'black'
                })
                .text(function(d) {
                    var textLabel = ""

                    switch (d) {
                        case 0:
                            textLabel = "CDU"
                        break;
                        case 1:
                            textLabel = "SPD"
                            break;
                        case 2:
                            textLabel = "FDP"
                            break;
                        case 3:
                            textLabel = "LINKE"
                            break;
                        case 4:
                            textLabel = "AFD"
                            break;
                        case 5:
                            textLabel = "GRUENE"
                            break;
                        default:
                            textLabel = ""
                    }
                    return textLabel;
                })

            scatterplot.append('g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + h + ')')
                .call(xAxis);

            scatterplot.append('g')
                .attr('class', 'y axis')
                .call(yAxis);

            scatterplot.append('text')
                .text(data.vars[col])
                .attr({
                    'class': 'scatterlabel',
                    'x': w/2,
                    'y': h + margin.bottom/2,
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle'
                });

            scatterplot.append('text')
                .text(data.vars[row])
                .attr({
                    'class': 'scatterlabel',
                    'transform': 'translate(' + (-pad/1.25) + ',' + (h/2) + ')rotate(270)',
                    'dominant-baseline': 'middle',
                    'text-anchor': 'middle'
                });

        }
    });