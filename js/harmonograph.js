/* Includes */

/// <reference path="../typings/jquery/jquery.d.ts"/>
/// <reference path="utilities.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var colorInput = document.getElementById( "color" );

var lineWidthInput = document.getElementById( "lineWidth" );

var stepInput = document.getElementById( "step" );

var iterationsInput = document.getElementById( "iterations" );

var smoothInput = document.getElementById( "smooth" );

var drawButton = document.getElementById( "draw" );

var openSettingsButton = document.getElementById( "openSettings" );
var saveSettingsInput = document.getElementById( "saveSettings" );
var randomButton = document.getElementById( "random" );

var animateButton = document.getElementById( "animate" );
var animateIcon = document.getElementById( "animateIcon" );
var timeFactorInput = document.getElementById( "timeFactor" );

var fInputs = [ ];
var fGroup = document.getElementById( "fGroup" );

var pInputs = [ ];
var pGroup = document.getElementById( "pGroup" );

var Ainputs = [ ];
var Agroup = document.getElementById( "Agroup" );

var dInputs = [ ];
var dGroup = document.getElementById( "dGroup" );

for( var i = 1; i <= 4; i++ )
{
    fInputs[ i ] = document.getElementById( "f" + i );
    pInputs[ i ] = document.getElementById( "p" + i );
    Ainputs[ i ] = document.getElementById( "A" + i );
    dInputs[ i ] = document.getElementById( "d" + i );
}

function onWindowResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    context.setTransform( 1, 0, 0, 1, canvas.width / 2, canvas.height / 2 );

    render();
}

onDebouncedWindowResize( onWindowResize );

$( '[ data-toggle="popover" ]' ).popover();


/* Validation */

function hasNonnegativeValue( input )
{
    var num = Number( input.value );
    return isFinite( num ) && 0 <= num;
}

function setupValidators()
{
    for( var i = 1; i <= 4; i++ )
    {
        validation.addValidator( fInputs[ i ], fGroup, hasNonnegativeValue );
        validation.addValidator( pInputs[ i ], pGroup, hasNonnegativeValue );
        validation.addValidator( Ainputs[ i ], Agroup, hasNonnegativeValue );
        validation.addValidator( dInputs[ i ], dGroup, hasNonnegativeValue );
    }
    validation.addValidator( colorInput, colorInput.parentNode, function( input )
    {
        return getColor() != null;
    } );
    validation.addValidator( lineWidthInput, lineWidthInput.parentNode, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 <= num;
    } );
    validation.addValidator( stepInput, stepInput.parentNode, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 < num;
    } );
    validation.addValidator( iterationsInput, iterationsInput.parentNode, function( input )
    {
        var num = Number( input.value );
        return isFinite( num ) && 0 < num;
    } );
}


/* Harmonograph */

var harmonograph = null;

function Harmonograph( fArr, pArr, Aarr, dArr, color, lineWidth, smooth, step, iterations )
{
    this.color = color;
    this.lineWidth = lineWidth;
    this.smooth = smooth;

    this.step = step;
    this.iterations = iterations;

    this.path = [ ];
    this.f = fArr;
    this.p = pArr;
    this.A = Aarr;
    this.d = dArr;

    this.createPath();
}

Harmonograph.prototype.createPath = function()
{
    this.path = [ ];

    var t = 0;
    for( var i = 0; i < this.iterations; i++ )
    {
        var x1 = this.A[ 1 ] * Math.sin( t * this.f[ 1 ] + this.p[ 1 ] ) * Math.exp( - this.d[ 1 ] * t );
        var x2 = this.A[ 2 ] * Math.sin( t * this.f[ 2 ] + this.p[ 2 ] ) * Math.exp( - this.d[ 2 ] * t );
        var y1 = this.A[ 3 ] * Math.sin( t * this.f[ 3 ] + this.p[ 3 ] ) * Math.exp( - this.d[ 3 ] * t );
        var y2 = this.A[ 4 ] * Math.sin( t * this.f[ 4 ] + this.p[ 4 ] ) * Math.exp( - this.d[ 4 ] * t );
        this.path.push( new Point( x1 + x2, y1 + y2 ) );
        t += this.step;
    }
};

Harmonograph.prototype.draw = function( smooth )
{
    if( this.smooth )
    {
        drawSmoothLines( context, this.path, this.color, this.lineWidth );
    }
    else
    {
        drawLines( context, this.path, this.color, this.lineWidth );
    }
};

function createHarmonograph()
{
    var lineWidth = Number( lineWidthInput.value );
    var smooth = smoothInput.selectedIndex == 0;
    var color = getColor();
    var step = Number( stepInput.value );
    var iterations = Number( iterationsInput.value );

    var f = [ ];
    var p = [ ];
    var A = [ ];
    var d = [ ];
    for( var i = 1; i <= 4; i++ )
    {
        f[ i ] = Number( fInputs[ i ].value );
        p[ i ] = Number( pInputs[ i ].value );
        A[ i ] = Number( Ainputs[ i ].value );
        d[ i ] = Number( dInputs[ i ].value );
    }

    harmonograph = new Harmonograph( f, p, A, d, color, lineWidth, smooth, step, iterations );
    setUrl();
    render();
}


/* Input */

animateButton.addEventListener( "click", function()
{
    animating = !animating;
    if( animating )
    {
        animateButton.classList.remove( "btn-success" );
        animateButton.classList.add( "btn-danger" );
        animateIcon.classList.remove( "glyphicon-play" );
        animateIcon.classList.add( "glyphicon-stop" );
    }
    else
    {
        animateButton.classList.add( "btn-success" );
        animateButton.classList.remove( "btn-danger" );
        animateIcon.classList.add( "glyphicon-play" );
        animateIcon.classList.remove( "glyphicon-stop" );
        setUrl();
        setInputs( urlSettings.getUrlData() );
    }
} );

var url_f = "f";
var url_p = "p";
var url_A = "A";
var url_d = "d";
var url_color = "c";
var url_lineWidth = "lw";
var url_smooth = "sm";
var url_step = "s";
var url_iterations = "i";

function createURL()
{
    var data = { };
    if( harmonograph != null )
    {
        data[ url_color ] = harmonograph.color.substring( 1 );
        data[ url_lineWidth ] = harmonograph.lineWidth;
        data[ url_smooth ] = harmonograph.smooth;
        data[ url_step ] = harmonograph.step;
        data[ url_iterations ] = harmonograph.iterations;

        for( var i = 1; i <= 4; i++ )
        {
            data[ url_f + i ] = harmonograph.f[ i ];
            data[ url_p + i ] = harmonograph.p[ i ];
            data[ url_A + i ] = harmonograph.A[ i ];
            data[ url_d + i ] = harmonograph.d[ i ];
        }
    }
    return urlSettings.createURL( data );
}

function createRandomHarmonograph()
{
    for( var i = 1; i <= 4; i++ )
    {
        fInputs[ i ].value = random( 200 );
        pInputs[ i ].value = random( 100 );
        Ainputs[ i ].value = random( 300 );
        dInputs[ i ].value = random( 0.5 );
    }
    createHarmonograph();
}

function getColor()
{
    var color = removeAllWhiteSpace( colorInput.value.toString() );
    if( validHexColorString( color ) )
    {
        return color;
    }
    else
    {
        return null;
    }
}

drawButton.addEventListener( "click", function()
{
    if( validation.allValid() )
    {
        $( ".modal" ).modal( "hide" );

        createHarmonograph();
    }
} );

randomButton.addEventListener( "click", function()
{
    createRandomHarmonograph();
} );

openSettingsButton.addEventListener( "click", function()
{
    setUrl();
} );

function setUrl()
{
    var newURL = createURL();
    saveSettings.value = newURL;
    history.replaceState( null, "", newURL );
}

function setInputs( data )
{
    for( var i = 1; i <= 4; i++ )
    {
        if( data[ url_f + i ] !== undefined )
        {
            fInputs[ i ].value = data[ url_f + i ];
        }
        if( data[ url_p + i ] !== undefined )
        {
            pInputs[ i ].value = data[ url_p + i ];
        }
        if( data[ url_A + i ] !== undefined )
        {
            Ainputs[ i ].value = data[ url_A + i ];
        }
        if( data[ url_d + i ] !== undefined )
        {
            dInputs[ i ].value = data[ url_d + i ];
        }
    }
    if( data[ url_color ] !== undefined )
    {
        colorInput.value = "#" + data[ url_color ];
    }
    if( data[ url_lineWidth ] !== undefined )
    {
        lineWidth.value = data[ url_lineWidth ];
    }
    if( data[ url_smooth ] !== undefined )
    {
        smoothInput.selectedIndex = data[ url_smooth ] == "true" ? 0 : 1;
    }
    if( data[ url_step ] !== undefined )
    {
        stepInput.value = data[ url_step ];
    }
    if( data[ url_iterations ] !== undefined )
    {
        iterationsInput.value = data[ url_iterations ];
    }
}

timeFactorInput.addEventListener( "change", function()
{
    if( timeFactorInput.value !== "" )
    {
        var num = Number( timeFactorInput.value );
        if( isFinite( num ) )
        {
            timeFactor = num;
        }
    }
} );


/* Animation */

var animating = false;
var timeFactor = 0.1

function update( elapsedTime )
{
    if( animating && harmonograph != null )
    {
        var delta = elapsedTime * timeFactor;
        for( var i = 1; i <= 4; i++ )
        {
            harmonograph.f[ i ] = ( harmonograph.f[ i ] + delta );
        }
        harmonograph.createPath();
        render();
    }
}


/* Render */

function render()
{
    clear( context );

    if( harmonograph != null )
    {
        harmonograph.draw();
    }
}


/* Main */

( function()
{
    onWindowResize();
    setInputs( urlSettings.getUrlData() )
    createHarmonograph();
    setupValidators();
    render();

    startAnimation( update, function() { } );
} )();
