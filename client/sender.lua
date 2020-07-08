local json = require("tsbot/json")
local math = require('math')
local string = require("string")

local function readAll(file)
    local f = assert(io.open(file, "rb"))
    local content = f:read("*all")
    f:close()
    return content
end

local charset = {}

-- qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890
for i = 48,  57 do table.insert(charset, string.char(i)) end
for i = 65,  90 do table.insert(charset, string.char(i)) end
for i = 97, 122 do table.insert(charset, string.char(i)) end

local function randomString(length)
  math.randomseed(os.clock()^5)

  if length > 0 then
    return randomString(length - 1) .. charset[math.random(1, #charset)]
  else
    return ""
  end
end

os.execute("mkdir lua_fetch")
local function execute(cmd)

    local file = randomString(10)
    os.execute(cmd .. " > lua_fetch/" .. file)
    local result = readAll("lua_fetch/" .. file)
    os.execute("rm lua_fetch/" .. file)

    return result
end


function post(data, url_suffix, json_response)
    json_response = json_response or false
    url_suffix = url_suffix or ""

    -- escape ' <- quotes in Shell command
    local d = json.encode(data):gsub("'", "'\"'\"'")

    local cmd = "curl -m 5 -d '" .. d .. "' -s -H 'Content-Type: application/json' -X POST " .. HTTP_SERVER_PATH .. url_suffix

    local response = execute(cmd)

    if json_response then
        return json.decode(response)
    else
        return response
    end
    
end