let Render = {}
// Node
let Node = Render.Node = function (options) {

    this.links = []
    let center = options.position
    
    // Create circle used to clip the image
    let clipCircle = new Path.Circle(center, options.radius - options.strokeWidth / 2 + 1)
    // Create image
    //let img = require(options.imageUrl)
    let image = new Raster(options.image)
    image.position = center
    image.onLoad = function () {
        // Resize the image only after it is loaded
        // If the image is not loaded, changing its size has no effect
        if (image.width < image.height) {
            image.scaling = options.radius * 2 / image.height
        } else {
            image.scaling = options.radius * 2 / image.width
        }
    }

    // Create the clipping group for the image
    let clipped = new Group(clipCircle, image)
    clipped.clipped = true

    this.text = new PointText(center.add(new Point(0, options.radius + 20)))
    this.text.justification = 'center'
    this.text.fillColor = '#444'
    this.text.content = options.name
    this.text.fontSize = 12
    this.text.fontWeight = 400
    this.text.shadowColor = new Color(0, 0, 0)

    // Create the circle's background filling
    let backCircle = new Path.Circle({
        center: center,
        radius: options.radius,
        fillColor: options.fillColor
    })
    
    // Create the circle's outline stroke
    let frontCircle = new Path.Circle({
        center: center,
        radius: options.radius,
        strokeColor: options.strokeColor,
        strokeWidth: options.strokeWidth
    })

    // The final paper.js element group
    this.element = new Group([frontCircle, clipped, backCircle, this.text])
    this.element.pivot = center
    // Make sure the z-index is correct
    // This needs to be done after creating the group
    backCircle.sendToBack()
    frontCircle.bringToFront()
    this.text.sendToBack()

    this._r = options.radius

    this.buttons = new NodeButtons(options, this)

    // relay some properties to the underlying paper.js element
    // Node.position
    this.__defineGetter__("position", function(){
        return this.element.position
    })
        
    this.__defineSetter__("position", function(val){
        this.element.position = val
        this.buttons.position = val
    })

    // Node.strokeWidth
    this.__defineGetter__("strokeWidth", function(){
        return frontCircle.strokeWidth
    })
        
    this.__defineSetter__("strokeWidth", function(val){
        frontCircle.strokeWidth = val
    })

    // Node.strokeColor
    this.__defineGetter__("strokeColor", function(){
        return frontCircle.strokeColor
    })
        
    this.__defineSetter__("strokeColor", function(val){
        frontCircle.strokeColor = val
    })

    // Node.name
    this.__defineGetter__("name", function(){
        return this.text.content
    })
        
    this.__defineSetter__("name", function(val){
        this.text.content = val
    })

    // Node.radius
    // Note that as soon as we add a circle to a group, it loses its radius property.
    // Therefore, changing its radius can only be done via scaling.
    this.__defineGetter__("radius", function(){
        return this._r
    })

    this.__defineSetter__("radius", function(val){
        this.element.scaling = val / this._r
        this._r = val
    })

    // Node.imageUrl
    this.__defineGetter__("imageUrl", function(){
        return image.source
    })

    this.__defineSetter__("imageUrl", function(val){
        image.source = val
    })

    // Node.onClick
    this.__defineSetter__("onClick", function(val){
        clipped.onClick = val.bind(this)
    })

    // Node.onDoubleClick
    this.__defineSetter__("onDoubleClick", function(val){
        clipped.onDoubleClick = val.bind(this)
    })

    // Node.onMouseEnter
    this.__defineSetter__("onMouseEnter", function(val){
        clipped.onMouseEnter = val.bind(this)
    })

    this.__defineSetter__("onMouseDrag", function(val){
        clipped.onMouseDrag = val.bind(this)
    })

    // Node.onMouseLeave
    this.__defineSetter__("onMouseLeave", function(val){
        clipped.onMouseLeave = val.bind(this)
    })
    this._projScale = 1.0

    this.__defineGetter__("projectionScaling", function (){
        return this._projScale
    })

    this.__defineSetter__("projectionScaling", function (val){
        this.element.scaling = val / this._projScale
        this._projScale = val
        this.buttons.radius = this.radius * val
    })

    // Node.onAddLink
    this.__defineSetter__("onAddLink", function(val){
        this.buttons.onAddLink = val.bind(this)
    })

    // Node.onEdit
    this.__defineSetter__("onEdit", function(val){
        this.buttons.onEdit = val.bind(this)
    })

    // Node.onDelete
    this.__defineSetter__("onDelete", function(val){
        this.buttons.onDelete = val.bind(this)
    })
}

Node.prototype.addChild = function (elem) {
    this.element.addChild(elem)
}

Node.prototype.sendToBack = function () {
    this.element.sendToBack()
}

Node.prototype.bringToFront = function () {
    this.element.bringToFront()
}

Node.prototype.remove = function () {
    this.element.remove()
    this.buttons.visible = false
}

Node.prototype.addTo = function (item) {
    this.element.addTo(item)
}


// Link
let Link = Render.Link = function (options) {
    this.head = options.head
    this.tail = options.tail

    this.element = Path.Line(this.head.position, this.tail.position)
    this.element.strokeColor = options.strokeColor
    this.element.strokeWidth = options.strokeWidth

    // Node.strokeWidth
    this.__defineGetter__("strokeWidth", function(){
        return this.element.strokeWidth
    })
        
    this.__defineSetter__("strokeWidth", function(val){
        this.element.strokeWidth = val
    })

    // Node.strokeColor
    this.__defineGetter__("strokeColor", function(){
        return this.element.strokeColor
    })
        
    this.__defineSetter__("strokeColor", function(val){
        this.element.strokeColor = val
    })

    // Node.onClick
    this.__defineSetter__("onClick", function(val){
        this.element.onClick = val.bind(this)
    })

    // Node.onMouseEnter
    this.__defineSetter__("onMouseEnter", function(val){
        this.element.onMouseEnter = val.bind(this)
    })

    // Node.onMouseLeave
    this.__defineSetter__("onMouseLeave", function(val){
        this.element.onMouseLeave = val.bind(this)
    })
}

Link.prototype.update = function() {
    this.element.segments[0].point = this.head.position
    this.element.segments[1].point = this.tail.position
    //this.element.sendToBack()
}

Link.prototype.sendToBack = function () {
    this.element.sendToBack()
}

Link.prototype.bringToFront = function () {
    this.element.bringToFront()
}

Link.prototype.remove = function () {
    this.element.remove()
}

let Animation = Render.Animation = function () {
    this.currentValue = null
    this.animating = null
    this.targetValue = null
}

Animation.prototype.animate = function (sourcePoint, targetPoint) {
    if (this.animating) {
        this.stop()
    }
    this.targetValue = targetPoint
    this.currentValue = sourcePoint
    this.animating = true
    this.firstTime = true
}

Animation.prototype.stop = function () {
    this.targetValue = null
    this.animating = false
    if (this.animating && this.onAnimationEnd) {
        this.onAnimationEnd(this)
    }
    this.currentValue = null
}

Animation.prototype.update = function () {
    if (this.animating) {
        let vector = this.targetValue.subtract(this.currentValue)
        if (this.firstTime) {
            this.firstTime = false
            if (this.onAnimationStart) {
                this.onAnimationStart(this)
            }
        } else {
            this.currentValue = this.currentValue.add(vector.divide(15))
            if (this.onAnimation) {
                this.onAnimation(this)
            }
            if (vector.length < 1) {
                this.currentValue = this.targetValue
                this.targetValue = null
                this.animating = false
                if (this.onAnimationEnd) {
                    this.onAnimationEnd(this)
                }
                this.currentValue = null
            }
        }
    }
}

let NodeButtons = Render.NodeButtons = function (options, node) {
    // Create the buttons
    function createPie(center, radius, angle, color, opacity){
        let start = new Point(center.x, center.y - radius);
        let through = new Point(0, -radius).rotate(angle / 2).add(center)
        let to = new Point(0, -radius).rotate(angle).add(center)
        let pie = Path.Arc(start, through, to)
        pie.add(center)
        pie.add(new Point(center.x, center.y - radius))
        pie.fillColor = color
        pie.scaling = 0.95
        pie.opacity = opacity
        return pie;
    }

    this.node = node
    
    this._addLinkButton = createPie(options.position, options.radius + 30, 120, '#000', 0.5);
    this._editButton = createPie(options.position, options.radius + 30, 120, '#000', 0.5);
    this._deleteButton = createPie(options.position, options.radius + 30, 120, '#000', 0.5);
    this._editButton.rotate(120, options.position)
    this._deleteButton.rotate(240, options.position)

    let bg = Shape.Circle(options.position, options.radius + 40)
    bg.fillColor = 'black'
    bg.opacity = 0.1

    this._r = options.radius + 30

    let imagePosition = new Point(0, - options.radius - 15).rotate(60)
    let add = require('../images/add.png')
    let image = new Raster(add)
    image.scaling = 0.15
    image.position = options.position.add(imagePosition)
    this._addLinkButton = new Group(this._addLinkButton, image)

    imagePosition = imagePosition.rotate(120)
    let edit = require('../images/edit.png')
    image = new Raster(edit)
    image.scaling = 0.15
    image.position = options.position.add(imagePosition)
    this._editButton = new Group(this._editButton, image)

    imagePosition = imagePosition.rotate(120)
    let deleteBtn = require('../images/delete.png')
    image = new Raster(deleteBtn)
    image.scaling = 0.15
    image.position = options.position.add(imagePosition)
    this._deleteButton = new Group(this._deleteButton, image)

    this.element = new Group(this._addLinkButton, this._editButton, this._deleteButton, bg)
    bg.sendToBack()
    this.element.remove()
    this._visible = false
    this.node = node

    this.__defineGetter__("radius", function(){
        return this._r
    })

    this.__defineSetter__("radius", function(val){
        
        this.element.scaling = (val + 30) / this._r
        this._r = val + 30
    })

    this.__defineGetter__("position", function(){
        return this.element.position
    })

    this.__defineSetter__("position", function(val){
        this.element.position = val
    })

    this.__defineGetter__("visible", function(){
        return this._visible
    })
    
    this.__defineSetter__("visible", function(val){
        this._visible = val
        if (val) {
            this.position = node.position
            this.element.insertBelow(node.element)
            //this.element.sendToBack()
        } else {
            this.element.remove()
        }
    })

    // Node.onAddLink
    this.__defineSetter__("onAddLink", function(val){
        this._addLinkButton.onClick = val
    })

    // Node.onEdit
    this.__defineSetter__("onEdit", function(val){
        this._editButton.onClick = val
    })

    // Node.onDelete
    this.__defineSetter__("onDelete", function(val){
        this._deleteButton.onClick = val
    })

    this._addLinkButton.onMouseEnter = function() {
        this.visible = true
        this._addLinkButton.firstChild.opacity = 0.7
        document.body.style.cursor = 'pointer'
    }.bind(this)

    this._addLinkButton.onMouseLeave = function() {
        this._addLinkButton.firstChild.opacity = 0.5
        document.body.style.cursor = 'default'
    }.bind(this)

    this._editButton.onMouseEnter = function() {
        this.visible = true
        this._editButton.firstChild.opacity = 0.7
        document.body.style.cursor = 'pointer'
    }.bind(this)

    this._editButton.onMouseLeave = function() {
        this._editButton.firstChild.opacity = 0.5
        document.body.style.cursor = 'default'
    }.bind(this)

    this._deleteButton.onMouseEnter = function() {
        this.visible = true
        this._deleteButton.firstChild.opacity = 0.7
        document.body.style.cursor = 'pointer'
    }.bind(this)

    this._deleteButton.onMouseLeave = function() {
        this._deleteButton.firstChild.opacity = 0.5
        document.body.style.cursor = 'default'
    }.bind(this)

    bg.onMouseLeave = function() {
        this.visible = false
    }.bind(this)
}


let AddLinkLine = Render.AddLinkLine = function (background) {
    this._visible = false

    this.element = Path.Line(new Point(0, 0), new Point(1, 1))
    this.element.strokeColor = "#bbb"
    this.element.strokeWidth = 3
    this.element.strokeCap = 'round'
    this.element.dashArray = [7, 10]
    this.element.remove()

    this.source = null


    this.__defineGetter__("visible", function(){
        return this._visible
    })
    
    this.__defineSetter__("visible", function(val){
        this._visible = val
        if (val) {
            this.element.insertAbove(background)
            //this.element.sendToBack()
        } else {
            this.element.remove()
        }
    })
}

AddLinkLine.prototype.attach = function(node) {
    this.source = node
    this.element.segments[0].point = this.source.position
}


AddLinkLine.prototype.update = function(mousePosition) {
    if (this.source != null) {
        this.element.segments[0].point = this.source.position
    }
    this.element.segments[1].point = mousePosition
}


export default Render;