(function(oGlobal)
{
    var running = false,
        beep = null,
        canvas = null,
        context = null,
        scale = { x: 0, y: 0 },
        lastTime = Date.now();

    var animateFrame = requestAnimationFrame || mozRequestAnimationFrame || webkitRequestAnimationFrame || oRequestAnimationFrame || function(callback)
    {
        return setTimeout(callback, 17);
    };
    
    var onTick = function()
    {
        var now = Date.now();
        
        if (now - lastTime > 1)
        {
            chip8.cycle();
            lastTime = now;
        }
        
        if (running) animateFrame(onTick);
    };
    
    var init = function()
    {
        var beepObjects = document.getElementsByClassName("beep");
        if (beepObjects.length == 0) return false;
        
        for (var i = 0; i < beepObjects.length; ++i)
            if (beepObjects[i].play || beepObjects[i].Play)
            {
                beep = beepObjects[i];
                break;
            }
        
        if (beep.object) beep = beep.object;
        if (beep.Play) beep.play = beep.Play;
        else if (navigator.userAgent.indexOf("Firefox") >= 0)
        {
            beep.type = "audio/wav";
            beep.src = "beep.wav";
        }
        beep.play();
        if (!beep) return false;
        
        canvas = document.getElementById("canvas");
        if (!canvas) return false;
        
        context = canvas.getContext("2d");
        if (!context) return false;
        
        scale.x = (canvas.width / chip8.SCREEN_WIDTH) | 0;
        scale.y = (canvas.height / chip8.SCREEN_HEIGHT) | 0;
        
        chip8.onDrawScreen = function(pixels)
        {
            for (var i = 0; i < chip8.SCREEN_HEIGHT; ++i)
                for (var j = 0; j < chip8.SCREEN_WIDTH; ++j)
                {
                    context.fillStyle = pixels[i][j] ? "#fff" : "#000";
                    context.fillRect(j * scale.x, i * scale.y, scale.x, scale.y);
                }
        };
        
        chip8.onPlaySound = function()
        {
            beep.play();
        };
        
        chip8.reset();
        
        return true;
    };
    
    var program =
    {
        run: function(button)
        {
            if (running) running = false;
            else
            {
                running = true;
                animateFrame(onTick);
            }
        },
        
        cycle: function()
        {
            if (running) running = false;
            chip8.cycle();
        },
        
        reset: function()
        {
            if (running) running = false;
            chip8.reset();
        },
        
        load: function()
        {
            var selectedProgram = document.getElementById("selectedProgram");
            if (!selectedProgram) return;
        
            var xhr = XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
            xhr.onreadystatechange = function()
            {
                if (xhr.readyState == 4 && xhr.status == 200)
                {
                    if (running) running = false;
                    chip8.load(xhr.responseText);
                }
            };
            
            xhr.open('GET', "programs/" + selectedProgram.options[selectedProgram.selectedIndex].value + ".ch8", true);
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
            xhr.send();
        }
    };
    
    if (init()) oGlobal.program = program;
    else alert("Program initialization failed !");
})(this);