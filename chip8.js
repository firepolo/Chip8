(function(oGlobal)
{
    var chip8 = chip8 || {};
    
    // Define all constants
    chip8.SCREEN_WIDTH = 64;
    chip8.SCREEN_HEIGHT = 32;
    
    // Declare all variable    
    var memory = [],
        pixels = [],
        stack = [],
        key = 0xF,
        V = [],
        DT = 0,
        ST = 0,
        I = 0,
        PC = 0,
        SP = 0;
    
    // Init variable    
    memory.length = 4096;
    stack.length = 12;
    V.length = 16;
    
    // Init screen
    for (var i = 0; i < chip8.SCREEN_HEIGHT; ++i) pixels[i] = [];
    
    // Fill memory with hexadecimal font (0x0 to 0x4f)
    var hexFontCache =
    [
        0xF0, 0x90, 0x90, 0x90, 0xF0,
        0x20, 0x60, 0x20, 0x20, 0x70,
        0xF0, 0x10, 0xF0, 0x80, 0xF0,
        0xF0, 0x10, 0xF0, 0x10, 0xF0,
        0x90, 0x90, 0xF0, 0x10, 0x10,
        0xF0, 0x80, 0xF0, 0x10, 0xF0,
        0xF0, 0x80, 0xF0, 0x90, 0xF0,
        0xF0, 0x10, 0x20, 0x40, 0x40,
        0xF0, 0x90, 0xF0, 0x90, 0xF0,
        0xF0, 0x90, 0xF0, 0x10, 0xF0,
        0xF0, 0x90, 0xF0, 0x90, 0x90,
        0xe0, 0x90, 0xe0, 0x90, 0xe0,
        0xF0, 0x80, 0x80, 0x80, 0xF0,
        0xe0, 0x90, 0x90, 0x90, 0xe0,
        0xF0, 0x80, 0xF0, 0x80, 0xF0,
        0xF0, 0x80, 0xF0, 0x80, 0x80
    ];
    
    for (var i = 0; i < hexFontCache.length; ++i) memory[i] = hexFontCache[i];
    
    // Declare callback when the screen should be drawed
    chip8.onDrawScreen = function(pixels) {};
    
    // Declare callback when the sound time is 0
    chip8.onPlaySound = function() {};
    
    // Allow from change state from keys
    chip8.setKey = function(index)
    {
        if (index >= 0 && index < 0xFF) key = index;
    };
    
    // Reset all chip8 without memory for not clear the program
    chip8.reset = function()
    {
        for (var i = 0; i < chip8.SCREEN_HEIGHT; ++i)
            for (var j = 0; j < chip8.SCREEN_WIDTH; ++j) pixels[i][j] = 0;
        
        for (var i = 0; i < stack.length; ++i) stack[i] = 0;
        for (var i = 0; i < V.length; ++i) V[i] = 0;
    
        key = 0xFF;
        DT = 0;
        ST = 0;
        I = 0;
        PC = 0x200;
        SP = 0;
        
        chip8.onDrawScreen(pixels);
    };
    
    // Allow from copy program(array) in memory
    chip8.load = function(programData)
    {
        for (var i = 0x200, count = memory.length; i < count; ++i) memory[i] = 0;
        for (var i = 0, count = programData.length; i < count; ++i) memory[0x200 + i] = programData.charCodeAt(i) & 0xFF;
        chip8.reset();
    };
    
    // Interpret the current instruction
    chip8.cycle = function()
    {
        var opcode = (memory[PC] << 8) | memory[PC + 1];
        
        if (DT > 0) --DT;
        if (ST > 0)
        {
            chip8.onPlaySound();
            --ST;
        }
        
        switch (opcode & 0xF000)
        {
            case 0x0:
            {
                switch (opcode & 0xFF)
                {
                    // 00E0: Clear screen
                    case 0xE0:
                        for (var i = 0; i < chip8.SCREEN_HEIGHT; ++i)
                            for (var j = 0; j < chip8.SCREEN_WIDTH; ++j) pixels[i][j] = 0;
                        chip8.onDrawScreen(pixels);
                        break;
                
                    // 00EE: Returns from a subroutine
                    case 0xEE:
                        PC = stack[--SP];
                        break;
                    
                    // 0NNN: RCA
                }
                
                PC += 2;
                break;
            }
            
            // 1NNN: Jump to NNN.
            case 0x1000:
            {
                PC = opcode & 0xFFF;
                break;
            }
            
            // 2NNN: Calls subroutine NNN.
            case 0x2000:
            {
                stack[SP++] = PC;
                PC = opcode & 0xFFF;
                break;
            }
            
            // 3XKK: Skip next instruction if VX == KK
            case 0x3000:
            {
                if (V[(opcode & 0xF00) >> 8] == (opcode & 0xFF)) PC += 4;
                else PC += 2;
                break;
            }
            
            // 4XKK: Skips next instruction if VX != KK
            case 0x4000:
            {
                if (V[(opcode & 0xF00) >> 8] == (opcode & 0xFF)) PC += 2;
                else PC += 4;
                break;
            }
            
            // 5XY0: Skips next instruction if VX == VY
            case 0x5000:
            {
                if (V[(opcode & 0xF00) >> 8] == V[(opcode & 0xF0) >> 4]) PC += 4;
                else PC += 2;
                break;
            }
            
            // 6XKK: VX = KK
            case 0x6000:
            {
                V[(opcode & 0xF00) >> 8] = opcode & 0xFF;
                PC += 2;
                break;
            }
            
            // 7XKK: VX += KK
            case 0x7000:
            {
                var x = (opcode & 0xF00) >> 8;
                V[x] = (V[x] + opcode & 0xFF) & 0xFF;
                PC += 2;
                break;
            }
            
            case 0x8000:
            {
                switch (opcode & 0xF)
                {
                    // 8XY0: VX = VY
                    case 0:
                        V[(opcode & 0xF00) >> 8] = V[(opcode & 0xF0) >> 4];
                        break;
                    
                    // 8XY1: VX |= VY
                    case 1:
                        V[(opcode & 0xF00) >> 8] |= V[(opcode & 0xF0) >> 4];
                        break;
                    
                    // 8XY2: VX &= VY
                    case 2:
                        V[(opcode & 0xF00) >> 8] &= V[(opcode & 0xF0) >> 4];
                        break;
                        
                    // 8XY3: VX ^= VY
                    case 3:
                        V[(opcode & 0xF00) >> 8] ^= V[(opcode & 0xF0) >> 4];
                        break;
                        
                    // 8XY4: VX += VY, VF is set to 1 when a carry and otherwise 0
                    case 4:
                        var x = (opcode & 0xF00) >> 8;
                        V[x] += V[(opcode & 0xF0) >> 4];
                        if (V[x] > 0xFF)
                        {
                            V[x] &= 0xFF;
                            V[0xF] = 1;
                        }
                        else V[0xF] = 0;
                        break;
                        
                    // 8XY5: VX -= VY, set VF = not borrow
                    case 5:
                        var x = (opcode & 0xF00) >> 8;
                        V[x] -= V[(opcode & 0xF0) >> 4];
                        if (V[x] < 0)
                        {
                            V[x] &= 0xFF;
                            V[0xF] = 0;
                        }
                        else V[0xF] = 1;
                        break;
                    
                    // 8XY6: VX >>= 1, set VF if least-significant bit is 1
                    case 6:
                        var x = (opcode & 0xF00) >> 8;
                        V[0xF] = V[x] & 0x1;
                        V[x] >>= 1;
                        break;
                    
                    // 8XY7: VX = VY - VX, set VF = not borrow
                    case 7:
                        var x = (opcode & 0xF00) >> 8;
                        V[x] = V[(opcode & 0xF0) >> 4] - V[x];
                        if (V[x] < 0)
                        {
                            V[x] &= 0xFF;
                            V[0xF] = 0;
                        }
                        else V[0xF] = 1;
                        break;
                    
                    // 8XYE: VX <<= 1, set VF is the most-significant bit is 1
                    case 0xE:
                        var x = (opcode & 0xF00) >> 8;
                        V[0xF] = (V[x] >> 7) & 0x1;
                        V[x] = (V[x] << 1) & 0xFF;
                        break;
                }
                
                PC += 2;
                break;
            }
            
            // 9XY0: Skips next instruction if VX != VY
            case 0x9000:
            {
                if (V[(opcode & 0xF00) >> 8] == V[(opcode & 0xF0) >> 4]) PC += 2;
                else PC += 4;
                break;
            }
            
            // ANNN: I = NNN(address)
            case 0xA000:
            {
                I = opcode & 0xFFF;
                PC += 2;
                break;
            }
            
            // BNNN: Jump to location NNN + V0
            case 0xB000:
            {
                PC = (opcode & 0xFFF) + V[0];
                break;
            }
            
            // CXKK: Set VX with random byte and KK
            case 0xC000:
            {
                V[(opcode & 0xF00) >> 8] = (Math.random() * 0xFF) & (opcode & 0xFF);
                PC += 2;
                break;
            }
            
            // DXYN: Display N-byte sprite starting at memory location I on screen at (VX, VY), set VF = collision
            case 0xD000:
            {
                var vx = V[(opcode & 0xF00) >> 8];
                var vy = V[(opcode & 0xF0) >> 4];
                var x, y, sprite;
                
                V[0xF] = 0;
            
                for (var i = 0, byteCount = opcode & 0xF; i < byteCount; ++i)
                {
                    sprite = memory[I + i];
                    y = vy + i;
                    
                    if (y < 0 || y > 31) y %= 32;
                    
                    for (var j = 0; j < 8; ++j)
                    {
                        if ((sprite & 0x80) > 0)
                        {
                            x = vx + j;
                            if (x < 0 || x > 63) x %= 64;
                            if (!(pixels[y][x] ^= 1)) V[0xF] = 1;
                        }
                        
                        sprite <<= 1;
                    }
                }
                
                chip8.onDrawScreen(pixels);
                PC += 2;
                break;
            }
            
            case 0xE000:
            {
                switch (opcode & 0xFF)
                {
                    // EX9E: Skip next instruction if key from VX is pressed
                    case 0x9E:
                        if (key == V[(opcode & 0xF00) >> 8])
                        {
                            key = 0xFF;
                            PC += 2;
                        }
                        break;
                        
                    // EXA1: Skip next instruction if key from VX is not pressed
                    case 0xA1:
                        if (key == V[(opcode & 0xF00) >> 8]) key = 0xFF;
                        else PC += 2;
                        break;
                }
                
                PC += 2;
                break;
            }
            
            case 0xF000:
            {
                switch (opcode & 0xFF)
                {
                    // FX07: VX = timerDelay
                    case 0x7:
                        V[(opcode & 0xF00) >> 8] = DT;
                        PC += 2;
                        break;
                        
                    // FX0A: Wait key press and store key in VX
                    case 0xA:
                        if (key < 0xFF)
                        {
                            V[(opcode & 0xF00) >> 8] = key;
                            key = 0xFF;
                            PC += 2;
                        }
                        break;
                        
                    // FX15: timerDelay = VX
                    case 0x15:
                        DT = V[(opcode & 0xF00) >> 8];
                        PC += 2;
                        break;
                        
                    // FX18: timerSound = VX
                    case 0x18:
                        ST = V[(opcode & 0xF00) >> 8];
                        PC += 2;
                        break;
                        
                    // FX1E: I += VX
                    case 0x1E:
                        I += V[(opcode & 0xF00) >> 8];
                        PC += 2;
                        break;
                        
                    // FX29: I = location from hexadecimal font
                    case 0x29:
                        I = V[(opcode & 0xF00) >> 8] * 5;
                        PC += 2;
                        break;
                        
                    // FX33: Store BCD of VX in location I, I + 1, I + 2
                    case 0x33:
                        var x = V[(opcode & 0xF00) >> 8];
                        memory[I] = (x / 100) | 0;
                        memory[I + 1] = (x / 10) % 10 | 0;
                        memory[I + 2] = x % 10;
                        PC += 2;
                        break;
                    
                    // FX55: Store V0 of length X in location I
                    case 0x55:
                        for (var i = 0, count = (opcode & 0xF00) >> 8; i <= count; ++i) memory[I + i] = V[i];
                        PC += 2;
                        break;
                    
                    // FX65: Load V0 of length X from location I
                    case 0x65:
                        for (var i = 0, count = (opcode & 0xF00) >> 8; i <= count; ++i) V[i] = memory[I + i];
                        PC += 2;
                        break;
                }
                break;
            }
        }
    };
    
    oGlobal.chip8 = chip8;
})(this);