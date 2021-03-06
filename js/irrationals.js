/* Includes */

/// <reference path="utilities.js" />
/// <reference path="irrationals_data.js" />

/* Document Elements */

var canvas = document.getElementById( "canvas" );
var context = canvas.getContext( "2d" );

var update = document.getElementById( "update" );
var digitLengthInput = document.getElementById( "digitLength" );
var irrationalLengthInput = document.getElementById( "irrationalLength" );
var lineWidthInput = document.getElementById( "lineWidth" );
var irrationalSelect = document.getElementById( "irrational" );

update.addEventListener( "click", function()
{
    if( validation.allValid() )
    {
        setData();

        $( ".modal" ).modal( "hide" );
    }
} );

function onWindowResize()
{
    canvas.width = canvas.clientWidth;
    canvas.height= canvas.clientHeight;

    context.setTransform( 1, 0, 0, 1, Math.round( canvas.width / 2 ) + 0.5, Math.round( canvas.height / 2 ) + 0.5 );

    render();
}

onDebouncedWindowResize( onWindowResize );


/* Variables */

var irrationals = {
    "PI" : PI,
    "e" : e,
    "Phi" : phi,
    "Square Root of 2" : sqrt_2
};

var irrational = irrationals[ irrationalSelect.value ];

var maxDigitLength = 4;
var minDigitLength = 1;
var maxIrrationalLength = 100000;
var minIrrationalLength = 1;

var data;

function setData()
{
    var digitLength = Number( digitLengthInput.value );
    var irrationalLength = Number( irrationalLengthInput.value );
    irrational = irrationals[ irrationalSelect.value ];
    data = generateLines( digitLength, irrationalLength );
    lineWidth = Number( lineWidthInput.value );
    render();
}


/* Validations */

var validation = new ValidationGroup();

validation.addValidator( digitLengthInput, function( input )
{
    var num = Number( input.value );
    return isFinite( num ) && minDigitLength <= num && num <= maxDigitLength;
} );
validation.addValidator( irrationalLengthInput, function( input )
{
    var num = Number( input.value );
    return isFinite( num ) && minIrrationalLength <= num && num <= maxIrrationalLength;
} );
validation.addValidator( lineWidthInput, function( input )
{
    var num = Number( input.value );
    return isFinite( num ) && 0 < num;
} );


/* Line */

function Line( start, end, color )
{
    this.start = start;
    this.end = end;
    this.color = color;
    this.draw = function()
    {
        var s = toCanvas( this.start );
        var e = toCanvas( this.end );
        context.beginPath();
        context.moveTo( s.x, s.y );
        context.lineTo( e.x, e.y );
        context.strokeStyle = this.color;
        context.stroke();
    };
}

/* Digit Position */

var circleRadiusPercentage = 0.95 / 2;

function generateNames( iterationsRemaining, prefix, positionNames )
{
    if( prefix === undefined && positionNames === undefined )
    {
        positionNames = [ ];
        generateNames( iterationsRemaining, "", positionNames );
        return positionNames;
    }
    else if( iterationsRemaining == 0 )
    {
        positionNames.push( prefix );
    }
    else
    {
        for( var i = 0; i <= 9; i++ )
        {
            generateNames( iterationsRemaining - 1, prefix + i.toString(), positionNames );
        }
    }
}

function generateNameData( digitLength )
{
    digitLength = Math.max( minDigitLength, Math.min( digitLength, maxDigitLength ) );

    var positionNames = generateNames( digitLength );
    var positionCount = positionNames.length;
    var segmentAngle = 2 * Math.PI / positionCount;
    var positions = { };

    for( var i = 0; i < positionCount; i++ )
    {
        var angle = segmentAngle * i + Math.PI / 2;
        var x = Math.sin( angle ) * circleRadiusPercentage;
        var y = Math.cos( angle ) * circleRadiusPercentage;
        positions[ positionNames[ i ] ] = {
            p: new Point( x, y ),
            color: randomSetDistributedColor()
        };
    }
    return positions;
}

function generateLines( digitLength, irrationalLength )
{
    var positions = generateNameData( digitLength );
    var lines = [ ];

    var iter = irrational.iter( digitLength, irrationalLength );
    var prev = iter.next();
    while( iter.hasNext() )
    {
        var next = iter.next();
        var start = positions[ prev ];
        var end = positions[ next ];
        var line = new Line( start.p, end.p, start.color );
        lines.push( line );
        prev = next;
    }
    return { positions: positions, lines: lines };
}


/* Rendering */

var lineWidth = 0.5;

function toCanvas( p )
{
    var min = Math.min( canvas.width, canvas.height );
    return new Point( p.x * min, p.y * min );
}

function render()
{
    clear( context );

    context.lineWidth = lineWidth;
    if( data !== undefined )
    {
        data.lines.forEach( function( line )
        {
            line.draw();
        } );
    }
}


/* Main */

( function main()
{
    onWindowResize();
    setData();
} )();
