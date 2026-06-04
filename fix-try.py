with open(r"E:\proget uni\projet2\artifacts\api-server\src\routes\admin.ts", "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

try_count = 0
catch_count = 0
for i, line in enumerate(lines):
    s = line.strip()
    if s == "try {":
        try_count += 1
        print(f"TRY   ligne {i+1}")
    if s.startswith("} catch"):
        catch_count += 1
        print(f"CATCH ligne {i+1}")

print(f"\nTotal: {try_count} try, {catch_count} catch")
