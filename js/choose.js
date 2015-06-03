/* Document Elements */

var mainContent = document.getElementById( "mainContent" );
var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );
context.translate( 0.5, 0.5 );

function onResize()
{
    canvas.width = mainContent.clientWidth;
    canvas.height = mainContent.clientHeight;

    render();
}

var resizeTimeout;
window.addEventListener( "resize", function()
{
    clearTimeout( resizeTimeout );
    resizeTimeout = setTimeout( onResize, 250 );
} );

var spinWheelButton = document.getElementById( "spinWheel" );
spinWheelButton.addEventListener( "click", spin );

var choicesTextArea = document.getElementById( "choices" );

window.onload = function()
{
    $( "#choicesModal" ).on( 'hidden.bs.modal', function()
    {
        updateChoices();
    } );
};

var saveChoicesButton = document.getElementById( "saveChoices" );
saveChoicesButton.addEventListener( "click", function()
{
    $( "#choicesModal" ).modal( "hide" );
    $( "#saveChoicesInput" ).val( getChoicesURL() );
    $( "#saveChoicesModal" ).modal( "show" );
} );

var winnerModal = document.getElementById( "winnerModal" );
var winnerText = document.getElementById( "winner" );


/* Utilities */

function HSVtoRGB( h, s, v )
{
    var r, g, b, i, f, p, q, t;
    if( h === undefined )
    {
        h = 1.0;
    }
    if( s === undefined )
    {
        s = 1.0;
    }
    if( v === undefined )
    {
        v = 1.0;
    }
    i = Math.floor( h * 6 );
    f = h * 6 - i;
    p = v * ( 1 - s );
    q = v * ( 1 - f * s );
    t = v * ( 1 - ( 1 - f ) * s );
    switch( i % 6 )
    {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    r = Math.floor( r * 255 );
    g = Math.floor( g * 255 );
    b = Math.floor( b * 255 );
    return "rgb( " + r + "," + g + "," + b + ")";
}

var goldenRatioConjugate = 0.618033988749895;
var h = Math.random();
function randomColor()
{
    h += goldenRatioConjugate;
    h %= 1;
    return HSVtoRGB( h, 0.85, 0.75 );
}

function random( min, max )
{
    return Math.random() * ( max - min ) + min;
}


/* Wheel */

function fillCircle( c, x, y, radius, fillStyle )
{
    c.beginPath();
    c.arc( x, y, radius, 0, 2 * Math.PI, false );
    c.fillStyle = fillStyle;
    c.fill();
}

var colors = [ ];
var minFontSize = 10;
var fontSizeStep = 10;
var maxIterations = 20;
var first = true;

function getFontSize( context, text, radius, textOffset, angle )
{
    var lastFontSize = 0;
    var fontSize = lastFontSize + fontSizeStep;

    var chordSize = getChordLength( radius - textOffset, angle );
    while( chordSize > fontSize )
    {
        lastFontSize = fontSize;
        fontSize += fontSizeStep;
        context.font = fontSize.toString() + "px Verdana";
        var size = context.measureText( text );
        chordSize = getChordLength( radius - textOffset - size.width, angle );
    }
    return lastFontSize;
}

function getChordLength( radius, angle )
{
    return Math.abs( 2 * Math.sin( angle / 2 ) * radius );
}

function getRadius()
{
    return Math.min( canvas.width, canvas.height ) / 2 * 0.8;
}

function drawWheel( x, y, radius, segmentStrings )
{
    var tempCanvas = document.createElement( "canvas" );
    var tempContext = tempCanvas.getContext( "2d" );
    tempCanvas.width = tempCanvas.height = radius * 2;
    tempContext.translate( radius, radius );

    var segments = segmentStrings.length;
    var segmentAngle = 2 * Math.PI / segments;
    var textOffset = radius * 0.05;
    for( var i = 0; i < segments; i++ )
    {
        tempContext.beginPath();
        if( colors.length < i + 1 )
        {
            colors.push( randomColor() );
        }
        tempContext.fillStyle = colors[ i ];
        tempContext.arc( 0, 0, radius, -segmentAngle, 0 );
        tempContext.lineTo( 0, 0 );
        tempContext.fill();

        tempContext.rotate( -segmentAngle / 2 );

        var text = segmentStrings[ i ];
        var fontSize = getFontSize( tempContext, text, radius, textOffset, segmentAngle );
        tempContext.font = fontSize.toString() + "px Verdana";
        var size = tempContext.measureText( text );
        tempContext.fillStyle = "#EEEEEE";
        tempContext.textBaseline = "middle";
        tempContext.fillText( text, radius - size.width - textOffset, 0 );

        tempContext.rotate( -segmentAngle / 2 );
    }

    context.save();
    context.translate( x, y );
    context.save();
    context.rotate( -rotationAngle );

    fillCircle( context, 3, 3, radius, "rgba( 128, 128, 128, 0.8 )" );
    context.drawImage( tempCanvas, -radius, -radius, radius * 2, radius * 2 );

    context.restore();

    context.fillStyle = "black";
    context.beginPath();
    var arrowSize = 0.08;
    context.moveTo( radius * ( 1 - arrowSize ), 0 );
    context.lineTo( radius * ( 1 + arrowSize ), radius * arrowSize );
    context.lineTo( radius * ( 1 + arrowSize ), -radius * arrowSize );
    context.fill();

    context.restore();
}

var rotationAngle = 0;

var maxRotationSpeed = 2 * Math.PI * 3.5;
var minRotationSpeed = 2 * Math.PI * 2.8;

var maxRotationSpeedDecreaseDelay = 1000 * 1.2;
var minRotationSpeedDecreaseDelay = 1000 * 0.8;

var minRotationSpeedDecreaseRate = 2 * Math.PI * 0.9;
var maxRotationSpeedDecreaseRate = 2 * Math.PI * 0.6;

var rotationSpeed = 0;
var rotationSpeedDecreaseDelay = 0;
var rotationSpeedDecreaseRate = 0;

var spinStart = 0;

function spin()
{
    updateChoices();

    rotationSpeed = random( minRotationSpeed, maxRotationSpeed );
    rotationSpeedDecreaseDelay = random( minRotationSpeedDecreaseDelay, maxRotationSpeedDecreaseDelay );
    rotationSpeedDecreaseRate = random( minRotationSpeedDecreaseRate, maxRotationSpeedDecreaseRate );

    spinStart = new Date().getTime();
}

function update( elapsedTime )
{
    if( rotationSpeed > 0 )
    {
        rotationAngle += rotationSpeed * elapsedTime;

        if( spinStart + rotationSpeedDecreaseDelay <= new Date().getTime() )
        {
            rotationSpeed -= rotationSpeedDecreaseRate * elapsedTime;
            if( rotationSpeed < 0 )
            {
                rotationSpeed = 0;
            }
        }
    }
}


/* Choices */

var choiceCount = 0;
var choices = [ ];

function updateChoices()
{
    choices = [ ];
    var choicesText = choicesTextArea.value;
    var choicesTextSplit = choicesText.split( choicesTextAreaSeperator );
    for( var i = 0; i < choicesTextSplit.length; i++ )
    {
        if( choicesTextSplit[ i ] )
        {
            choices.push( choicesTextSplit[ i ] );
        }
    }
}

var choicesUrlBeginning = "?";
var choicesUrlSeperator = "+";
var choicesTextAreaSeperator = "\n";

function getChoicesURL()
{
    var url = window.location.href;
    var index = url.indexOf( choicesUrlBeginning );
    if( index >= 0 )
    {
        url = url.substring( 0, url.indexOf( choicesUrlBeginning ) );
    }
    url += choicesUrlBeginning;
    choices.forEach( function( choice )
    {
        url += choice + choicesUrlSeperator;
    } );
    return url;
}

function readChoicesFromURL()
{
    var url = decodeURIComponent( window.location.href );
    var index = url.indexOf( choicesUrlBeginning );
    if( index >= 0 )
    {
        var choicesString = url.substring( url.indexOf( choicesUrlBeginning ) + 1 );
        var choicesSplit = choicesString.split( choicesUrlSeperator );
        choicesSplit.forEach( function( choice )
        {
            if( choice )
            {
                choicesTextArea.value += choice + choicesTextAreaSeperator;
            }
        } );
    }
    updateChoices();
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
    if( elapsedTime < 100 )
    {
        update( elapsedTime / 1000 );
    }
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
    drawWheel( canvas.width / 2, canvas.height / 2, getRadius(), choices );
}


/* Main */

function main()
{
    readChoicesFromURL();
    onResize();
    render();
    animate( 0 );
}

main();
