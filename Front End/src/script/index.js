// import 'bootstrap';
// import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/index.scss';
import * as d3 from 'd3';
import paper from 'paper';
import H2 from './lib/h2';
import Render from './render';
import {basic, shortestPath, missionKG, neighbors} from './API';


// 注意：编号和状态必须使用string类型的数字，不能使用int类型，否则返回不了任何结果
// 所有的id都应该使用int类型的数字


import('../data.json').then(function(Module){
  // console.log(Render)
  let originAnimation = new Render.Animation();

  originAnimation = new Render.Animation()
	// Feed the animated values into our Poincare Disk model
	originAnimation.onAnimationStart = function (e) {
		pd.startDrag(e.currentValue)
	}
	originAnimation.onAnimation = function (e) {
		pd.drag(e.currentValue)
	}
	originAnimation.onAnimationStop = function (e) {
		pd.endDrag(e.currentValue)
  }
  
  let data = Module.default;
  console.log(data)

  let canvas = document.getElementById('chart')
  
  paper.install(window);
  canvas.style.width = '100%';
  canvas.style.height = '90%';


  // let nodeLinkLayer = new Layer();
  
  let simulation = d3.forceSimulation();

  let linkForce = d3.forceLink()
  .id(function(d) {
    return d.id;
  })

  simulation
  .force("charge", d3.forceManyBody().strength(-100))
  .force('collid', d3.forceCollide().radius(5))
  .force('link', linkForce);

  simulation.nodes(data.nodes);
  linkForce.links(data.links);
  
  paper.setup(canvas)
  
  
  let viewRadius = Math.min(document.getElementById('chart').offsetWidth,document.getElementById('chart').offsetHeight)/2 - 20;
  let circles = [];
  let arcs = [];
  let currentAddLinkSrc = null
  // console.log(view);

  function arrayDiff(oldData, newData, compare) {
    var diff = {
      add: [],
      remove: []
    }
    for (var i in oldData) {
      var found = false
      for (var j in newData) {
        if (compare(oldData[i], newData[j])) {
          found = true
        }
      }
      if (!found) {
        diff.remove.push(oldData[i])
      }
    }
    for (var i in newData) {
      var found = false
      for (var j in oldData) {
        if (compare(oldData[j], newData[i])) {
          found = true
        }
      }
      if (!found) {
        diff.add.push(newData[i])
      }
    }
    return diff
  }

  function refreshWithData(newData) {
    let nodeEdits = arrayDiff(data.nodes, newData.nodes, function (a, b) {
      //console.log(a, b)
      return a.id == b.id
    })
    let linkEdits = arrayDiff(data.links, newData.links, function (a, b) {
      return a.source.id == b.source.id && a.target.id == b.target.id
    })

    // console.log(nodeEdits, linkEdits)

    refresh(nodeEdits, linkEdits)
  }

  function refresh(nodeEdits, linkEdits) {

    let newNodes = []
    for (var i in data.nodes) {
      let found = false
      for (var j in nodeEdits.remove) {
        if (data.nodes[i].id == nodeEdits.remove[j].id) {
          found = true
        }
      }
      if (!found) {
        newNodes.push(data.nodes[i])
      }
    }
    newNodes = newNodes.concat(nodeEdits.add)
    // console.log("newNodes:", newNodes)

    // linkEdits might be incomplete. Check for edits required by addition and deletion
    for (var i in data.links) {
      let src = false, dest = false
      for (var j in newNodes) {
        if (data.links[i].source.id == newNodes[j].id) {
          src = true
        }
        if (data.links[i].target.id == newNodes[j].id) {
          dest = true
        }
      }
      if (!src || !dest) {
        linkEdits.remove.push(data.links[i])
      }
    }

    let newLinks = []
    for (var i in data.links) {
      let found = false
      for (var j in linkEdits.remove) {
        if (data.links[i].source.id == linkEdits.remove[j].source.id && data.links[i].target.id == linkEdits.remove[j].target.id) {
          found = true
        }
      }
      if (!found) {
        newLinks.push(data.links[i])
      }
    }
    
    for (var i in linkEdits.add) {
      let src = false, dest = false
      for (var j in newNodes) {
        if (linkEdits.add[i].source.id == newNodes[j].id) {
          src = true
        }
        if (linkEdits.add[i].target.id == newNodes[j].id) {
          dest = true
        }
      }
      if (src && dest) {
        newLinks.push(linkEdits.add[i])
      }
    }

    console.log(linkEdits)

    updateRenderWithDiff(nodeEdits, linkEdits)

    data.nodes = newNodes
    data.links = newLinks

    //console.log(data)
    simulation.stop()
    simulation = d3.forceSimulation();

    linkForce = d3.forceLink()
    .id(function(d) {
      return d.id;
    })

    simulation
    .force("charge", d3.forceManyBody().strength(-100))
    .force('collid', d3.forceCollide().radius(5))
    .force('link', linkForce);

    simulation.nodes(data.nodes);
    linkForce.links(data.links);
    simulation.alphaTarget(.3).restart()

    console.log("Refreshing done!")
  }


  function makeNode(data) {

    let center = new Point( data.x, data.y).add(view.center);
    // let center = new Point((Math.random() - 0.5) * viewRadius * 4, (Math.random() - 0.5) * viewRadius * 4).add(view.center)
    let c = '#ed7'
    
    if (data.entityType == "人") {
      c = '#77e'
    } else if (data.entityType == "物体") {
      c = '#e77'
    }
    
    let circle = new Render.Node({
      position: center,
      radius: 20,
      fillColor: 'white',
      strokeColor: c,
      strokeWidth: 3,
      image: require('../nodeImg/' + data.name +'.jpg'),
      name: data.name
    })
    
    circle.data = data
    circle.epos = center
    circle.onClick = function () {
      if (currentAddLinkSrc == null) {
        this.element.bringToFront()
        originAnimation.animate(this.position, view.center)
      } else {
        let newLink = {
          source: currentAddLinkSrc,
          target: this.data,
          relation_1: "None",
          relation_2: "None"
        }
        currentAddLinkSrc = null
        refresh({
          add: [],
          remove: []
        }, {
          add: [newLink],
          remove: []
        });
        addLinkLine.visible = false
        currentAddLinkSrc = null
      }
    }

    circle.onMouseEnter = function () {
    // 	// When focused, also bring to front.
    // 	// Also, we show its buttons and hide its text.
      this.strokeWidth += 1
      this.radius += 2
      this.bringToFront()
      for (var i in circles) {
        circles[i].buttons.visible = false
        circles[i].text.visible = true
      }
      if (currentAddLinkSrc == null) {
        this.buttons.visible = true
      }
      this.text.visible = false
      document.body.style.cursor = 'pointer'
    }

    circle.onMouseLeave = function () {
      this.strokeWidth -= 1
      this.radius -= 2
    }
    
    circle.onAddLink = function() {
      addLinkLine.attach(this)
      addLinkLine.visible = true
      currentAddLinkSrc = this.data
    }

    circle.onEdit = function () {
      console.log(this)
    }

    circle.onDelete = function () {
      refresh({
        add: [],
        remove: [this.data]
      }, {
        add: [],
        remove: []
      });
    }

    return circle
  }

  function updateRenderWithData(data) {
    for (let i = 0; i < data.nodes.length; i++) {
      let circle = makeNode(data.nodes[i])
      circles.push(circle)
    }

    for (let i = 0; i < data.links.length; i++) {
  
      var src = null, dest = null
      for (let j = 0; j < circles.length; j++) {
        if (data.links[i].source.id == circles[j].data.id) {
          src = circles[j]
        } else if (data.links[i].target.id == circles[j].data.id) {
          dest = circles[j]
        }
      }
      
      if (src != null && dest != null) {
        let link = new Render.Link({
          head: src,
          tail: dest,
          strokeColor: "#ddd",
          strokeWidth: 2
        })
        link.sendToBack()
        arcs.push(link)
      }
  
    }
  }

  function updateRenderWithDiff(nodeDiff, linkDiff) {
    let newCircles = []
    for (var i in circles) {
      let found = false
      for (var j in nodeDiff.remove) {
        if (nodeDiff.remove[j].id == circles[i].data.id) {
          circles[i].remove()
          found = true
        }
      }
      if (!found) {
        newCircles.push(circles[i])
      }
    }
    for (let i = 0; i < nodeDiff.add.length; i++) {
      let circle = makeNode(nodeDiff.add[i])
      newCircles.push(circle)
    }
    circles = newCircles


    let newArcs = []
    for (var i in arcs) {
      let found = false
      for (var j in linkDiff.remove) {
        if (linkDiff.remove[j].source.id == arcs[i].head.data.id && linkDiff.remove[j].target.id == arcs[i].tail.data.id) {
          arcs[i].remove()
          found = true
        }
      }
      if (!found) {
        newArcs.push(arcs[i])
      }
    }
  
    for (let i = 0; i < linkDiff.add.length; i++) {
      var src = null, dest = null
      for (let j = 0; j < circles.length; j++) {
        if (linkDiff.add[i].source.id == circles[j].data.id) {
          src = circles[j]
        }
        if (linkDiff.add[i].target.id == circles[j].data.id) {
          dest = circles[j]
        }
      }
      
      if (src != null && dest != null) {
        let link = new Render.Link({
          head: src,
          tail: dest,
          strokeColor: "#ddd",
          strokeWidth: 2
        })
        link.sendToBack()
        background.sendToBack()
        newArcs.push(link)
        console.log(src, dest)
      }
    }
    arcs = newArcs
    console.log(circles, arcs)
  }
  
  let background = new Shape.Circle(view.center, viewRadius)
  // background.strokeColor = 'black'
  background.fillColor = '#F6F5F5'

  console.log(data)

  updateRenderWithData(data)
  
  let addLinkLine = new Render.AddLinkLine(background)
  
  background.sendToBack();

  background.onMouseUp = function() {
    addLinkLine.visible = false
    currentAddLinkSrc = null
  }

  addLinkLine.element.onMouseUp = function() {
    addLinkLine.visible = false
    currentAddLinkSrc = null
  }
  
  let pd = new H2.PoincareDisk({
    center: view.center,
    zoom: 2.0,
    radius: viewRadius
  })
  
  
  window.addEventListener('wheel', function (e) {
    if (e.deltaY > 0) {
      // Call zoom() with a positive value to zoom in 
      pd.zoom(0.01)
    } else if (e.deltaY < 0) {
      // Call zoom() with a negative value to zoom in
      pd.zoom(-0.01)
    }
  })


  simulation.on('tick', function tick() {
    
  })
  
  view.onMouseDown = function(e) {
    originAnimation.stop()
    pd.startDrag(e.point)
  }
  
  view.onMouseDrag = function(e) {
    originAnimation.stop()
    pd.drag(e.point)
  }
  
  view.onMouseUp = function(e) {
    originAnimation.stop()
    simulation.alphaTarget(0);
    pd.endDrag(e.point)
  }

  view.onMouseEnter = function () {
		for (let i in circles) {
			circles[i].buttons.visible = false
			circles[i].text.visible = true
		}
		document.body.style.cursor = 'move'
  }

  view.onMouseMove = function (e) {
    addLinkLine.update(e.point)
  }
  
  view.onFrame = function() {
    for (let i in circles) {
      // Call toHyperbolic() with a point in E2 space (layout by d3)
      // to get its coordinates in SCREEN SPACE (NOT H2 SPACE!!!)
      let tmp = pd.toHyperbolic(new H2.Point({
        x: circles[i].data.x,
        y: circles[i].data.y,
      }))
      circles[i].position.x = tmp.x
      circles[i].position.y = tmp.y
      circles[i].buttons.position.x = tmp.x
      circles[i].buttons.position.y = tmp.y
      circles[i].projectionScaling = tmp.scale
    }
  
    for (let i in arcs) {
      arcs[i].update()
    }

    originAnimation.update()
  }

  let counter = 0

  let lessData = {
    nodes: data.nodes.slice(0, 20),
    links: data.links.slice(0, data.links.length)
  }, moreData = {
    nodes: data.nodes.slice(0, 30),
    links: data.links.slice(0, data.links.length),
  }


  document.getElementById("anim-button").onclick = function () {
    if (counter % 2 == 0) {
      refreshWithData(lessData)
    } else {
      refreshWithData(moreData)
    }
    console.log(data)
    counter += 1
  }


})
