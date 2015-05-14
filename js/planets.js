/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );
context.translate( 0.5, 0.5 );

var mainContent = document.getElementById( "mainContent" );

function onWindowResize()
{
    canvas.width = mainContent.clientWidth;
    canvas.height = mainContent.clientHeight;
}

var resizeTimer;
window.addEventListener( "resize", function()
{
    clearTimeout( resizeTimer );
    resizeTimer = setTimeout( onWindowResize, 250 );
} );
onWindowResize();


/* Utilities */

function random( x, y )
{
    if( y === undefined )
    {
        return Math.random() * x;
    }
    else
    {
        return random( y - x ) + x;
    }
}

function randomColor()
{
    var r = Math.floor( random( 256 ) );
    var g = Math.floor( random( 256 ) );
    var b = Math.floor( random( 256 ) );
    return "rgb(" + r + "," + g + "," + b + ")";
}

function fillCircle( c, centerX, centerY, radius, fillStyle )
{
    context.beginPath();
    context.arc( centerX, centerY, radius, 0, 2 * Math.PI, false );
    context.fillStyle = fillStyle;
    context.fill();
}

function drawLines( c, points, strokeStyle )
{
    if( points.length > 1 )
    {
        c.strokeStyle = strokeStyle;
        c.beginPath();
        var p = points[ 0 ];
        c.moveTo( p.x, p.y );
        for( var i = 1; i < points.length; i++ )
        {
            var point = points[ i ];
            c.lineTo( point.x, point.y );
        }
        c.stroke();
    }
}

function distance( p1, p2 )
{
    var xDiff = p1.x - p2.x;
    var yDiff = p1.y - p2.y;
    var dist = Math.sqrt( xDiff * xDiff + yDiff * yDiff );
    return dist != 0 ? dist : distanceEpsilon;
}


/* Physics Stuff */

var distanceEpsilon = 0.000000001;

function Vector( x, y )
{
    this.x = x;
    this.y = y;
    
    this.copy = function()
    {
        return new Vector( this.x, this.y );
    };
    this.toString = function()
    {
        return this.x + ", " + this.y;
    };
    this.getLength = function()
    {
        var length = Math.sqrt( this.x * this.x + this.y * this.y );
        return length != 0 ? length : distanceEpsilon;
    };
    this.getUnitVector = function()
    {
        return this.scalarDivide( this.getLength() );
    };
    this.scalarMultiply = function( scalar )
    {
        return new Vector( scalar * this.x, scalar * this.y );
    };
    this.scalarDivide = function( scalar )
    {
        if( scalar == 0 )
        {
            throw "Cannot divide by 0.";
        }
        return new Vector( this.x / scalar, this.y / scalar );
    };
    this.add = function( v )
    {
        return new Vector( this.x + v.x, this.y + v.y );
    };
    this.subtract = function( v )
    {
        return new Vector( this.x - v.x, this.y - v.y );
    };
}

var G = 6.673 * Math.pow( 10, -11 ); // N(m/kg)^2)

function calculateGravitationForce( b1, b2 )
{
    var b1V = b1.position;
    var b2V = b2.position;
    
    var dist = distance( b1V, b2V );
    var radius = b1.radius + b2.radius;
    if( dist < radius )
    {
        dist = radius;
    }
    var scalar = -G * ( b1.getMass() * b2.getMass() ) / ( dist * dist );
    var distanceVector = b1V.subtract( b2V );
    var unitVector = distanceVector.getUnitVector();
    var vector = unitVector.scalarMultiply( scalar );
    return vector;
}

function calculateTotalGravitationalForce( b1 )
{
    var total = new Vector( 0, 0 );
    for( var i = 0; i < bodies.length; i++ )
    {
        if( b1 != bodies[ i ] )
        {
            var v = calculateGravitationForce( b1, bodies[ i ] );
            total = total.add( v );
        }
    }
    return total;
}


/* Bodies */

var bodies = [ ];

var minPathDistance = 5;
var maxPathPoints = 100;
var maxSpeed = 50;

function Body( x, y )
{
    if( x === undefined )
    {
        x = random( canvas.width );
    }
    if( y == undefined )
    {
        y = random( canvas.height );
    }
    
    this.position = new Vector( x, y );
    this.radius = random( 30, 50 );
    this.speed = new Vector( random( -maxSpeed, maxSpeed ), random( -maxSpeed, maxSpeed ) );
    this.fixed = false;
    this.color = randomColor();
    this.pathColor = randomColor();
    this.path = [ this.position.copy() ];
    this.lastGForce = new Vector( 0, 0 );

    this.getMass = function()
    {
        return this.radius * 10000000000000000;
    };
    this.calculateTotalGForce = function()
    {
        this.lastGForce = calculateTotalGravitationalForce( this );
    };
    this.applyTotalGForce = function( elapsedTime )
    {
        if( this.fixed )
        {
            return;
        }
        var acceleration = this.lastGForce.scalarDivide( this.getMass() );
        var deltaVelocity = acceleration.scalarMultiply( elapsedTime );
        this.speed = this.speed.add( deltaVelocity );
        var deltaPosition = this.speed.scalarMultiply( elapsedTime );
        this.position = this.position.add( deltaPosition );
        
        this.updatePath();
    };
    this.updatePath = function()
    {
        var lastPosition = this.path[ this.path.length - 1 ];
        if( distance( lastPosition, this.position ) > 5 )
        {
            this.path.push( this.position.copy() );
        }
        if( this.path.length > 100 )
        {
            this.path.shift();
        }
    };
    this.paint = function( c )
    {
        drawLines( c, this.path, this.pathColor );
        fillCircle( c, this.position.x, this.position.y, this.radius, this.color );
    };
}

function updateBodies( elapsedTime )
{
    for( var i = 0; i < bodies.length; i++ )
    {
        bodies[ i ].calculateTotalGForce();
    }
    for( var i = 0; i < bodies.length; i++ )
    {
        bodies[ i ].applyTotalGForce( elapsedTime );
    }
}

function paintBodies( c )
{
    for( var i = bodies.length - 1; i >= 0; i-- )
    {
        bodies[ i ].paint( c );
    }
}


/* Animation */

( function()
{
    var lastTime = 0;
    var vendors = [ 'webkit', 'moz' ];
    for( var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x )
    {
        window.requestAnimationFrame = window[ vendors[ x ] + 'RequestAnimationFrame' ];
        window.cancelAnimationFrame = window[ vendors[ x ] + 'CancelAnimationFrame' ]
                                   || window[ vendors[ x ] + 'CancelRequestAnimationFrame' ];
    }
    if( !window.requestAnimationFrame )
    {
        window.requestAnimationFrame = function( callback, element )
        {
            var currTime = new Date().getTime();
            var timeToCall = Math.max( 0, 16 - ( currTime - lastTime ) );
            var id = window.setTimeout( function() { callback( currTime + timeToCall ); }, timeToCall );
            lastTime = currTime + timeToCall;
            return id;
        };
    }

    if( !window.cancelAnimationFrame )
        window.cancelAnimationFrame = function( id )
        {
            clearTimeout( id );
        };
}() );

var lastTime = 0;
function animate( time )
{
    var elapsedTime = time - lastTime;
    lastTime = time;

    render();
    updateBodies( elapsedTime / 1000 );
    window.requestAnimationFrame( animate );
}


/* Rendering */

function clear()
{
    context.save();

    context.setTransform( 1, 0, 0, 1, 0, 0 );
    context.clearRect( 0, 0, canvas.width, canvas.height );

    context.restore();
}

function render()
{
    clear();
    paintBodies( context );
}


/* Input Handler */

window.addEventListener( "click", function( e )
{
    var body = new Body( e.x, e.y );
    body.fixed = true;
    bodies.push( body );
} );

/* Main */

function main()
{
    var body = new Body();
    body.fixed = false;
    bodies.push( body );
    
    body = new Body();
    body.fixed = false;
    bodies.push( body );
    
    body = new Body();
    body.fixed = false;
    bodies.push( body );

    animate( 0.00001 );
}

main();