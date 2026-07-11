// ── LANGUAGES ─────────────────────────────────────────────

const rust = {
  name: 'Rust',
  sub: 'Systems programming — safe, fast, concurrent',
  steps: [

    // ── STEP 1 ──────────────────────────────────────────────
    { name: 'What is Rust & Why?', content: `
      <div class="content-section">
        <div class="content-label">The Three Problems Rust Eliminates</div>
        <table class="nfr-table">
          <tr><td><strong style="color:#ef4444;">Use-after-free</strong></td><td>You free memory, then accidentally read/write it again. In C: silent corruption or crash. In Rust: compile-time error — the compiler proves the memory is still alive.</td></tr>
          <tr><td><strong style="color:#ef4444;">Double-free</strong></td><td>You free the same memory twice — undefined behaviour. In Rust: impossible. Exactly one owner exists at a time; it is freed exactly once when the owner goes out of scope.</td></tr>
          <tr><td><strong style="color:#ef4444;">Buffer overflow</strong></td><td>Write past the end of an array — in C this overwrites adjacent memory silently. Rust checks bounds at runtime and panics rather than causing undefined behaviour.</td></tr>
        </table>
      </div>
      <div class="content-section">
        <div class="content-label">The Three Pillars</div>
        <table class="nfr-table">
          <tr><td><strong style="color:#10b981;">Safe</strong></td><td>Memory and concurrency bugs caught at compile time, not at 3am in production. Zero undefined behaviour in safe Rust.</td></tr>
          <tr><td><strong style="color:#326CE5;">Fast</strong></td><td>No garbage collector — no GC pauses, no runtime overhead. Performance comparable to C and C++. Zero-cost abstractions: you pay only for what you use.</td></tr>
          <tr><td><strong style="color:#f59e0b;">Concurrent</strong></td><td>The ownership + type system prevents data races at compile time. "Fearless concurrency" — the compiler stops you from sharing mutable state unsafely.</td></tr>
        </table>
        <div class="insight-box" style="margin-top:12px;">
          <strong>Zero-cost abstraction</strong> means a high-level feature (iterators, async, generics) compiles down to the same machine code you would have written by hand. You get readable code AND bare-metal performance.
        </div>
      </div>
      <div class="content-section">
        <div class="content-label">Real-world Rust Adoption</div>
        <table class="nfr-table">
          <tr><td><strong>Linux Kernel</strong></td><td>First language added alongside C in 50 years. Used for new device drivers where memory safety is critical.</td></tr>
          <tr><td><strong>Discord</strong></td><td>Rewrote a Go service in Rust. Latency dropped dramatically, memory use fell from GBs to MBs. GC pauses gone.</td></tr>
          <tr><td><strong>Figma</strong></td><td>Multiplayer server written in Rust. Handles millions of real-time collaborative edits with predictable low latency.</td></tr>
          <tr><td><strong>Firefox (Servo)</strong></td><td>Browser engine components rewritten in Rust. CSS engine in Firefox is Rust — parallel, safe, fast.</td></tr>
          <tr><td><strong>Cloudflare</strong></td><td>Edge network proxies, firewall rules engine. Replacing C for performance-critical networking code.</td></tr>
          <tr><td><strong>AWS</strong></td><td>Firecracker (microVM for Lambda/Fargate) written in Rust. Boots a VM in 125ms safely.</td></tr>
          <tr><td><strong>ripgrep</strong></td><td>Grep replacement — faster than grep, ag, and ack. Pure Rust. Uses Rust's regex crate (also Rust).</td></tr>
        </table>
      </div>
      <div class="content-section">
        <div class="content-label">Your First Rust Program</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;"># Create a new project
cargo new hello_rust
cd hello_rust

# src/main.rs is created automatically:
fn main() {
    println!("Hello, Rust!");          // println! is a macro, not a function

    let name = "world";
    let n: u32 = 42;
    println!("Hello, {}! The answer is {}", name, n);

    // Formatted with named args (Rust 2021+)
    println!("Hello, {name}! The answer is {n}");
}

# Run it
cargo run       # compile + run
cargo build     # compile only (debug)
cargo build --release   # optimized build
cargo check     # type-check without compiling (fast)</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: Why not just use C++ which is also fast?</strong></td><td>C++ lets you write unsafe code and trusts you to be correct. Rust enforces correctness at compile time. A C++ codebase accumulates memory bugs silently; Rust refuses to compile them. Also: Rust has a modern package manager (Cargo), better ergonomics, and first-class tooling.</td></tr>
          <tr><td><strong>Q: Why not use Go if I need concurrency?</strong></td><td>Go has a GC which causes latency spikes — bad for real-time systems. Go's concurrency model (goroutines + channels) is simpler but doesn't prevent data races at compile time. Rust prevents data races statically and has no GC overhead.</td></tr>
          <tr><td><strong>Q: Is Rust hard to learn?</strong></td><td>The ownership model is the hardest part — your intuitions from other languages are wrong. Plan for 2-4 weeks of fighting the borrow checker before things click. After that, Rust becomes a conversation with the compiler about correctness.</td></tr>
        </table>
      </div>
    ` },

    // ── STEP 2 ──────────────────────────────────────────────
    { name: 'Variables, Types & Mutability', content: `

      <!-- ── 1. let vs let mut ── -->
      <div class="content-section">
        <div class="content-label">1 · let vs let mut — Immutable by Default</div>
        <div class="insight-box" style="border-left-color:#326CE5;background:#f0f4ff;">
          In Rust, <strong>every variable is immutable by default</strong>. You must explicitly opt in to mutation with <code>mut</code>. This is opposite to most languages (Python, JavaScript, Go) where variables are mutable unless you say otherwise.<br><br>
          Why? Immutability is the safer default — accidental mutation is a common source of bugs, especially in concurrent code. The compiler enforces it, so you can trust a non-mut binding is never changed.
        </div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">fn main() {

    // ── IMMUTABLE ──────────────────────────────
    let x = 5;
    println!("x = {x}");   // 5

    // x = 10;   // COMPILER ERROR:
    //           // cannot assign twice to immutable variable x
    //           // help: consider making this binding mutable: mut x

    // ── MUTABLE ────────────────────────────────
    let mut y = 5;
    println!("y = {y}");   // 5
    y = 10;                 // OK — y was declared mut
    y += 1;                 // compound assignment also works
    println!("y = {y}");   // 11

    // ── PRACTICAL GUIDELINE ────────────────────
    // Start with let. Switch to let mut only when you actually need to mutate.
    // If you see let mut but the variable is never changed,
    // the compiler warns you: "variable does not need to be mutable".
}</pre>
        <table class="nfr-table" style="margin-top:12px;">
          <tr><td><strong>let x = 5</strong></td><td>Immutable binding. x is fixed at 5 forever in this scope. Compiler error if you try to change it.</td></tr>
          <tr><td><strong>let mut x = 5</strong></td><td>Mutable binding. x can be reassigned. The mut applies to the binding, not to the value.</td></tr>
          <tr><td><strong>Benefits of default immutability</strong></td><td>Easier reasoning — you can read code knowing a binding's value won't secretly change. Enables compiler optimisations. Essential for safe concurrency.</td></tr>
        </table>
      </div>

      <!-- ── 2. Type Inference ── -->
      <div class="content-section">
        <div class="content-label">2 · Type Inference — The Compiler Figures It Out</div>
        <div class="insight-box">
          Rust is statically typed — every variable has a type known at compile time. But unlike Java/C++ where you often write types everywhere, Rust's type inference engine usually figures out the type from context. You only need to annotate when it's ambiguous.
        </div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// Rust infers the type from the value
let x = 42;          // inferred: i32  (default integer type)
let y = 3.14;        // inferred: f64  (default float type)
let flag = true;     // inferred: bool
let letter = 'A';    // inferred: char

// Explicit annotation — type goes after a colon
let x: i64 = 42;
let y: f32 = 3.14;

// Sometimes you MUST annotate — when inference is ambiguous
let guess: u32 = "42".parse().unwrap();
//         ^^^  without this, the compiler says:
//              "type annotations needed — consider giving guess a type"

// Inference works across lines — compiler looks at HOW you use the variable
let mut list = Vec::new();  // type unknown yet
list.push(1);               // now compiler knows: Vec&lt;i32&gt;
list.push(2);</pre>
      </div>

      <!-- ── 3. Integer Types ── -->
      <div class="content-section">
        <div class="content-label">3 · Integer Types — Signed &amp; Unsigned</div>
        <div class="insight-box" style="border-left-color:#10b981;background:#f0fdf4;">
          Rust has 12 integer types. Choosing the right one matters for memory efficiency and correctness. The naming convention is simple: <strong>i</strong> = signed (can be negative), <strong>u</strong> = unsigned (non-negative only), followed by the bit width.
        </div>
        <table class="nfr-table">
          <tr style="background:#f8f8f8;"><td style="font-weight:800;">Type</td><td style="font-weight:800;">Size</td><td style="font-weight:800;">Range</td><td style="font-weight:800;">When to use</td></tr>
          <tr><td><strong>i8</strong></td><td>1 byte</td><td>-128 to 127</td><td>Tiny signed values, audio samples</td></tr>
          <tr><td><strong>i16</strong></td><td>2 bytes</td><td>-32,768 to 32,767</td><td>Small signed values</td></tr>
          <tr><td><strong style="color:#326CE5;">i32</strong></td><td>4 bytes</td><td>-2.1B to 2.1B</td><td><strong>Default</strong> — use when unsure</td></tr>
          <tr><td><strong>i64</strong></td><td>8 bytes</td><td>-9.2 × 10¹⁸ to 9.2 × 10¹⁸</td><td>Timestamps, large counters</td></tr>
          <tr><td><strong>i128</strong></td><td>16 bytes</td><td>±1.7 × 10³⁸</td><td>Cryptography, huge numbers</td></tr>
          <tr><td><strong>isize</strong></td><td>pointer-sized</td><td>platform dependent</td><td>Pointer arithmetic, offsets</td></tr>
          <tr><td><strong>u8</strong></td><td>1 byte</td><td>0 to 255</td><td>Bytes, pixel values, binary data</td></tr>
          <tr><td><strong>u16</strong></td><td>2 bytes</td><td>0 to 65,535</td><td>Port numbers, small unsigned</td></tr>
          <tr><td><strong>u32</strong></td><td>4 bytes</td><td>0 to 4.2B</td><td>IDs, counts that are never negative</td></tr>
          <tr><td><strong>u64</strong></td><td>8 bytes</td><td>0 to 1.8 × 10¹⁹</td><td>File sizes, large unsigned counts</td></tr>
          <tr><td><strong>u128</strong></td><td>16 bytes</td><td>0 to 3.4 × 10³⁸</td><td>UUIDs, very large counts</td></tr>
          <tr><td><strong style="color:#326CE5;">usize</strong></td><td>pointer-sized</td><td>0 to max pointer</td><td><strong>Array/Vec indices</strong> — always use this for indexing</td></tr>
        </table>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:12px 0;">// Integer literals — multiple formats
let decimal     = 1_000_000;      // underscores make large numbers readable
let hex         = 0xFF;           // hexadecimal  (255)
let octal       = 0o77;           // octal        (63)
let binary      = 0b1111_0000;    // binary       (240)
let byte: u8    = b'A';           // byte literal (65) — u8 only

// Type suffix in the literal itself
let x = 42u64;                    // u64 without separate annotation
let y = -10i8;                    // i8

// Integer operations
let sum    = 5 + 10;              // 15
let diff   = 95 - 4;              // 91
let prod   = 4 * 30;              // 120
let quot   = 56 / 5;              // 11  (integer division — truncates)
let remain = 56 % 5;              // 1

// usize for indexing — required by the compiler
let v = vec![10, 20, 30];
let i: usize = 2;
println!("{}", v[i]);             // 30
// v[2i32] — ERROR: index must be usize, not i32</pre>
      </div>

      <!-- ── 4. Float Types ── -->
      <div class="content-section">
        <div class="content-label">4 · Floating-Point Types</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// f32 — 32-bit float  (single precision, ~7 decimal digits)
// f64 — 64-bit float  (double precision, ~15 decimal digits)  ← DEFAULT

let x = 2.0;           // inferred: f64 (always default to f64)
let y: f32 = 3.0;      // explicit f32

// Float operations
let sum  = 2.5 + 1.5;  // 4.0
let diff = 5.0 - 2.0;  // 3.0
let prod = 2.0 * 4.5;  // 9.0
let quot = 9.0 / 2.0;  // 4.5  (NOT integer division — 4.5 not 4)
let rem  = 9.0 % 2.0;  // 1.0

// Common float constants and methods
let pi = std::f64::consts::PI;     // 3.141592653589793
let inf = f64::INFINITY;
let nan = f64::NAN;

println!("{}", 2.0f64.sqrt());     // 1.4142135623730951
println!("{}", 8.0f64.cbrt());     // 2.0  (cube root)
println!("{}", 100.0f64.log10());  // 2.0
println!("{:.2}", 3.14159f64);     // 3.14  (format to 2 decimal places)

// GOTCHA: floats are NOT directly comparable with ==
// Use an epsilon check instead:
let a = 0.1 + 0.2;
let b = 0.3;
// a == b might be false due to floating point representation
println!("{}", (a - b).abs() &lt; f64::EPSILON);  // true — correct way</pre>
      </div>

      <!-- ── 5. Boolean ── -->
      <div class="content-section">
        <div class="content-label">5 · Boolean</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">let t: bool = true;
let f: bool = false;

// Logical operators
let and = true && false;    // false   (short-circuit: if left is false, right skipped)
let or  = true || false;    // true    (short-circuit: if left is true, right skipped)
let not = !true;            // false

// Boolean from comparisons
let x = 5;
let is_big    = x > 3;     // true
let is_even   = x % 2 == 0; // false
let in_range  = x >= 1 && x <= 10;  // true

// Booleans ARE NOT integers in Rust (unlike C)
// You cannot do: if 1 { }   — ERROR: expected bool, found integer
// You cannot do: true + true — ERROR: cannot add bool to bool

// Boolean in if expressions — if is an EXPRESSION that returns a value
let msg = if is_big { "big" } else { "small" };
println!("{msg}");    // "big"

// bool is exactly 1 byte in memory
println!("{}", std::mem::size_of::&lt;bool&gt;());  // 1</pre>
      </div>

      <!-- ── 6. char ── -->
      <div class="content-section">
        <div class="content-label">6 · char — Unicode Scalar Value</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// char uses SINGLE quotes. Strings use double quotes.
let c1: char = 'z';
let c2: char = 'Z';
let c3: char = '0';
let c4: char = '🦀';   // full Unicode — char is 4 bytes (u32-sized)
let c5: char = '中';   // Chinese character — works fine

// char is 4 bytes — every Unicode scalar value fits
println!("{}", std::mem::size_of::&lt;char&gt;());  // 4

// char methods
println!("{}", 'a'.is_alphabetic());   // true
println!("{}", '5'.is_numeric());      // true
println!("{}", 'A'.is_uppercase());    // true
println!("{}", 'a'.to_uppercase().next().unwrap());  // 'A'

// char ↔ integer conversion
let ascii_a = 'A' as u32;    // 65
let back = char::from(65u8);  // 'A'

// IMPORTANT: "hello" is a &str (string), 'h' is a char (single character)
// Strings are NOT arrays of chars in Rust — they're UTF-8 bytes
// This is important for string indexing (you can't do s[0] on a String)</pre>
      </div>

      <!-- ── 7. Shadowing ── -->
      <div class="content-section">
        <div class="content-label">7 · Shadowing — Re-declare the Same Name</div>
        <div class="insight-box" style="border-left-color:#f59e0b;background:#fffbeb;">
          Shadowing means declaring a new variable with the same name as an existing one using <code>let</code>. The new variable <em>shadows</em> the old one — you can't access the old one anymore in that scope. This is NOT the same as mutation.
        </div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// ── BASIC SHADOWING ────────────────────────────────────────
let x = 5;
let x = x + 1;      // new binding — shadows previous x. Old x is gone.
let x = x * 2;      // shadows again
println!("{x}");    // 12

// ── KEY SUPERPOWER: CAN CHANGE THE TYPE ────────────────────
let spaces = "   ";           // type: &str  (string slice)
let spaces = spaces.len();    // type: usize (completely different type!)
println!("{spaces}");         // 3

// With mut this would be ILLEGAL:
// let mut spaces = "   ";
// spaces = spaces.len();  // ERROR: expected &str, found usize

// ── SHADOWING IN A BLOCK ────────────────────────────────────
let x = 10;
{
    let x = x * 5;     // inner shadow — only exists inside this block
    println!("{x}");   // 50
}
println!("{x}");       // 10  — outer x is back, inner shadow is gone

// ── REAL WORLD USE: PARSING INPUT ──────────────────────────
// Often you read input as a string, then shadow it with the parsed number
let input = "42";                           // type: &str
let input: u32 = input.trim().parse()       // type: u32 — same name, new type
    .expect("must be a number");
println!("Doubled: {}", input * 2);         // 84</pre>
        <table class="nfr-table" style="margin-top:12px;">
          <tr><td></td><td><strong>let mut</strong></td><td><strong>Shadowing (let)</strong></td></tr>
          <tr><td>Change value</td><td>✓ Yes</td><td>✓ Yes (creates new binding)</td></tr>
          <tr><td>Change type</td><td>✗ No</td><td>✓ Yes</td></tr>
          <tr><td>Old value accessible</td><td>✓ Yes (it changed)</td><td>✗ No (shadowed = gone in scope)</td></tr>
          <tr><td>Syntax</td><td>x = new_value</td><td>let x = new_value</td></tr>
        </table>
      </div>

      <!-- ── 8. Tuple ── -->
      <div class="content-section">
        <div class="content-label">8 · Tuples — Fixed-Length, Mixed Types</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// Tuples group values of DIFFERENT types — size fixed at compile time
let tup: (i32, f64, bool, char) = (500, 6.4, true, 'z');

// Access by index (dot notation)
let five_hundred = tup.0;   // 500 — i32
let six_point_four = tup.1; // 6.4 — f64
let is_true = tup.2;        // true — bool

// Destructuring — unpack all at once
let (a, b, c, d) = tup;
println!("{a}, {b}, {c}, {d}");   // 500, 6.4, true, z

// Destructuring with _ to ignore fields you don't need
let (first, _, _, last) = tup;

// Nested tuples
let nested: ((i32, i32), bool) = ((1, 2), true);
println!("{}", (nested.0).1);    // 2

// Unit tuple () — empty tuple, zero size
// It's the return type of functions that don't explicitly return anything
let unit: () = ();
// fn foo() { }  — implicitly returns ()

// Tuples in function return — return multiple values
fn min_max(v: &[i32]) -> (i32, i32) {
    (*v.iter().min().unwrap(), *v.iter().max().unwrap())
}
let (lo, hi) = min_max(&[3, 1, 4, 1, 5, 9, 2, 6]);
println!("min={lo}, max={hi}");   // min=1, max=9</pre>
      </div>

      <!-- ── 9. Array ── -->
      <div class="content-section">
        <div class="content-label">9 · Arrays — Fixed-Length, Same Type, Stack Memory</div>
        <div class="insight-box">
          Arrays in Rust have a <strong>fixed length known at compile time</strong>. They live entirely on the stack — no heap allocation. For growable collections, use <code>Vec&lt;T&gt;</code> (covered in the Collections step).
        </div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// Type annotation: [element_type; length]
let arr: [i32; 5] = [1, 2, 3, 4, 5];

// Shorthand: fill with the same value
let zeroes = [0; 10];      // [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
let fives  = [5u8; 4];    // [5, 5, 5, 5] — four u8 fives

// Indexing — zero based
let first = arr[0];        // 1
let last  = arr[4];        // 5

// Length
println!("{}", arr.len()); // 5

// SAFE bounds checking — Rust panics with a message instead of UB
// arr[10];   // thread 'main' panicked at 'index out of bounds: the len is 5 but the index is 10'
// (In C: silent memory corruption or crash with no useful message)

// Iterating over an array
for elem in arr {
    print!("{elem} ");   // 1 2 3 4 5
}

for (i, elem) in arr.iter().enumerate() {
    println!("arr[{i}] = {elem}");
}

// Mutable array
let mut scores = [90, 85, 78, 92, 88];
scores[2] = 95;             // update element
scores.sort();              // sort in place — [78, 85, 88, 90, 95] (with use std)

// Arrays as function parameters (passed by reference to avoid copying)
fn sum(arr: &[i32]) -> i32 {    // &[i32] is a SLICE — works for any length
    arr.iter().sum()
}
println!("{}", sum(&arr));   // 15
println!("{}", sum(&fives)); // also works</pre>
      </div>

      <!-- ── 10. Slices ── -->
      <div class="content-section">
        <div class="content-label">10 · Slices — Views Into Sequences</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// A slice is a REFERENCE to a contiguous part of a collection
// It does NOT own the data — it borrows it
let arr = [1, 2, 3, 4, 5];

let all   = &arr[..];     // entire array
let first3 = &arr[..3];   // [1, 2, 3]  — indices 0,1,2
let last2  = &arr[3..];   // [4, 5]     — from index 3 to end
let middle = &arr[1..4];  // [2, 3, 4]  — indices 1,2,3

// Range syntax
// [..n]   — 0 to n-1
// [n..]   — n to end
// [a..b]  — a to b-1 (exclusive end)
// [a..=b] — a to b   (inclusive end)

// Slices know their length — not just a raw pointer
println!("{}", middle.len());  // 3

// &str is a string slice — same concept
let s = String::from("hello world");
let hello: &str = &s[0..5];    // "hello"
let world: &str = &s[6..11];   // "world"

// Why slices are powerful: write one function that works on
// arrays, Vecs, or any contiguous sequence
fn print_first_two(items: &[i32]) {
    if items.len() >= 2 {
        println!("{} {}", items[0], items[1]);
    }
}
print_first_two(&arr);                        // from array
print_first_two(&vec![10, 20, 30]);           // from Vec</pre>
      </div>

      <!-- ── 11. const and static ── -->
      <div class="content-section">
        <div class="content-label">11 · const vs static</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// const — compile-time constant
// Rules: must have type annotation, SCREAMING_SNAKE_CASE, no runtime value
const MAX_RETRIES: u32 = 3;
const PI: f64 = 3.14159265358979;
const BUFFER_SIZE: usize = 1024 * 64;    // expressions allowed if computable at compile time

// const is INLINED everywhere it's used — like a #define in C
// No memory address. Using MAX_RETRIES in 10 places = 10 literal 3s in the binary.

// static — one fixed memory location that lives for the whole program
static APP_NAME: &str = "DevLearn";
static mut COUNTER: u32 = 0;   // mutable static — UNSAFE to access/modify

// Accessing static is instant — it's just reading from a fixed address
println!("{APP_NAME}");

// Modifying mutable static requires unsafe block (dangerous — no thread safety)
unsafe { COUNTER += 1; }   // you rarely need this in practice</pre>
        <table class="nfr-table" style="margin-top:12px;">
          <tr><td></td><td><strong>const</strong></td><td><strong>static</strong></td></tr>
          <tr><td>Memory location</td><td>Inlined — no address</td><td>One fixed address</td></tr>
          <tr><td>Can be mutable</td><td>No</td><td>Yes (but unsafe)</td></tr>
          <tr><td>Type annotation</td><td>Required</td><td>Required</td></tr>
          <tr><td>Use for</td><td>Numeric limits, config values</td><td>Global state (rare), &amp;str constants</td></tr>
          <tr><td>Convention</td><td>SCREAMING_SNAKE_CASE</td><td>SCREAMING_SNAKE_CASE</td></tr>
        </table>
      </div>

      <!-- ── 12. Type Conversion ── -->
      <div class="content-section">
        <div class="content-label">12 · Type Conversion — No Implicit Coercion</div>
        <div class="insight-box" style="border-left-color:#ef4444;background:#fff5f5;">
          Rust <strong>never implicitly converts</strong> between numeric types. In C, mixing int and long is automatic. In Rust, you must convert explicitly. This prevents silent precision loss or sign errors.
        </div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// as — explicit cast (can truncate or change sign — be careful)
let x: i32 = 300;
let y = x as i16;     // 44  — 300 wraps around (300 - 256 = 44)  TRUNCATION!
let z = x as u8;      // 44  — same truncation
let f = x as f64;     // 300.0 — safe widening

let pi: f64 = 3.99;
let n = pi as i32;    // 3 — truncates decimal (does NOT round)

// Safe conversions — use From/Into (only for lossless conversions)
let small: i32 = 42;
let big: i64 = i64::from(small);     // i32 always fits in i64 — safe
let big: i64 = small.into();         // same thing with Into syntax

// Fallible conversions — use try_from / try_into
use std::convert::TryFrom;
let big: i64 = 1000;
let small = i32::try_from(big);    // Ok(1000)  — fits
let big2: i64 = 9_999_999_999;
let small2 = i32::try_from(big2);  // Err(TryFromIntError) — doesn't fit

// String conversions
let n: i32 = 42;
let s: String = n.to_string();        // 42 → "42"
let back: i32 = s.parse().unwrap();   // "42" → 42</pre>
      </div>

      <!-- ── Cross Q&A ── -->
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: Can I use a variable before initialising it?</strong></td><td>No. Rust enforces definite assignment. <code>let x: i32;</code> then using <code>x</code> is a compile error: "use of possibly-uninitialized variable". However, you can declare without a value and assign later — as long as the compiler can prove it's always assigned before use in all code paths.</td></tr>
          <tr><td><strong>Q: What happens on integer overflow?</strong></td><td>In debug mode: runtime panic with a clear message ("attempt to add with overflow"). In release mode (--release): silent wrapping (two's complement). For explicit control: <code>checked_add()</code> returns Option, <code>saturating_add()</code> clamps at min/max, <code>wrapping_add()</code> always wraps.</td></tr>
          <tr><td><strong>Q: Why is f64 the default float and not f32?</strong></td><td>On modern 64-bit CPUs, f64 operations are no slower than f32 (both are native FPU operations). f64 gives ~15 decimal digits of precision vs ~7 for f32. You only choose f32 when memory is tight (e.g. graphics card buffers where you're storing millions of floats) or when the API requires it.</td></tr>
          <tr><td><strong>Q: Why can't I index a String with s[0]?</strong></td><td>Strings in Rust are stored as UTF-8 bytes. A character might be 1, 2, 3, or 4 bytes. Index 0 would give you a byte, not a character — and the first "character" might span multiple bytes. Rust refuses to give you a potentially meaningless index. Use s.chars().nth(0) for character access or &s[0..n] for byte slices.</td></tr>
          <tr><td><strong>Q: What is the difference between String and &str?</strong></td><td>String is a heap-allocated, growable, owned string. &str is a string slice — a borrowed view into a string (anywhere: heap, stack, binary). Use &str in function parameters when you only need to read. Return String when you're creating new string data. The golden rule: prefer &str for read-only, String for owned data you'll mutate or return.</td></tr>
          <tr><td><strong>Q: Are Rust's arrays faster than Vecs?</strong></td><td>Arrays can be faster because: (1) stack allocation is faster than heap, (2) the compiler knows the exact size at compile time enabling optimisations, (3) no pointer indirection. But Vec is far more flexible. In practice: use arrays for small, fixed collections (coordinates, RGB, small buffers). Use Vec for everything else.</td></tr>
        </table>
      </div>
    ` },

    // ── STEP 3 ──────────────────────────────────────────────
    { name: 'Ownership — The Core Concept', content: `
      <div class="content-section">
        <div class="content-label">The Three Rules of Ownership</div>
        <div class="insight-box" style="border-left-color:#f59e0b;background:#fffbeb;">
          <strong>Rule 1:</strong> Each value in Rust has exactly one <em>owner</em>.<br>
          <strong>Rule 2:</strong> There can only be one owner at a time.<br>
          <strong>Rule 3:</strong> When the owner goes out of scope, the value is dropped (memory freed).<br><br>
          These three rules are enforced at <strong>compile time</strong> — zero runtime cost.
        </div>
      </div>
      <div class="content-section">
        <div class="content-label">Stack vs Heap — Why It Matters</div>
        <table class="nfr-table">
          <tr><td><strong>Stack</strong></td><td>Fast. Fixed size at compile time. Automatically freed when function returns. i32, bool, f64, char, arrays live here.</td></tr>
          <tr><td><strong>Heap</strong></td><td>Dynamic size. You allocate it. Someone must free it. String, Vec, HashMap live here. This is where memory bugs happen in C/C++.</td></tr>
        </table>
        <div class="insight-box" style="margin-top:10px;">Ownership is how Rust manages heap memory without a GC: the owner is responsible for freeing the memory. When the owner's scope ends, Rust calls <code>drop()</code> automatically.</div>
      </div>
      <div class="content-section">
        <div class="content-label">Move Semantics</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">let s1 = String::from("hello");   // s1 owns the string on the heap
let s2 = s1;                       // MOVE: s1's ownership transferred to s2

// println!("{s1}");               // ERROR: "value borrowed here after move"
// s1 is no longer valid — Rust MOVED it, didn't copy

println!("{s2}");                  // OK — s2 is the owner now

// When s2 goes out of scope, Rust frees the heap memory.
// No double-free possible — only one owner exists at a time.</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Copy Types vs Move Types</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// Copy types: live on the stack, cheap to duplicate, both variables stay valid
let x = 5;
let y = x;          // COPY — x is still valid
println!("{x} {y}"); // both work fine

// Types that implement Copy: i32, u64, f64, bool, char, tuples of Copy types

// Non-Copy types: own heap memory, moved not copied
let s1 = String::from("hello");
let s2 = s1.clone();  // explicit DEEP COPY — both are valid, both own separate heap data
println!("{s1} {s2}"); // both work

// clone() is expensive (copies all heap data). Use it intentionally.</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Ownership Through Function Calls</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">fn takes_ownership(s: String) {       // s comes into scope
    println!("{s}");
}   // s goes out of scope, drop() called, heap memory freed

fn makes_copy(x: i32) {              // x is copied in (i32 is Copy)
    println!("{x}");
}   // x goes out of scope, nothing special

fn main() {
    let s = String::from("hello");
    takes_ownership(s);               // s is MOVED into the function
    // println!("{s}");              // ERROR: s was moved!

    let x = 5;
    makes_copy(x);                    // x is COPIED
    println!("{x}");                  // x is still valid — it was copied, not moved

    // Return values also transfer ownership:
    let s2 = gives_ownership();       // function creates String, returns (moves) it to s2
}

fn gives_ownership() -> String {
    String::from("hello")             // returned value moves to caller
}</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: If String moves, how do I use it after passing to a function?</strong></td><td>Use references (borrowing) — see next step. Or clone() if you really need two owners. The compiler will tell you which applies.</td></tr>
          <tr><td><strong>Q: When exactly is drop() called?</strong></td><td>At the closing brace of the scope that owns the value. For a local variable: end of the function. For a struct field: when the struct is dropped. Deterministic — not GC-scheduled.</td></tr>
          <tr><td><strong>Q: Can I implement Copy for my own type?</strong></td><td>Yes — if all fields are Copy and the type has no custom Drop implementation. Add #[derive(Copy, Clone)] to your struct. If your type owns heap data (contains String, Vec, etc.) you cannot implement Copy.</td></tr>
          <tr><td><strong>Q: What is the "value borrowed here after move" error?</strong></td><td>You moved a value (transferred ownership) and then tried to use the original binding. The value no longer exists at the original name. Either use borrowing (&s) or clone() before moving.</td></tr>
        </table>
      </div>
    ` },

    // ── STEP 4 ──────────────────────────────────────────────
    { name: 'References & Borrowing', content: `
      <div class="content-section">
        <div class="content-label">Borrowing — Use Without Owning</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">fn calculate_length(s: &String) -> usize {  // & means reference — borrow without owning
    s.len()
}   // s goes out of scope but does NOT drop the String (it doesn't own it)

fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1);  // pass a reference — s1 is borrowed, not moved
    println!("{s1} has length {len}");  // s1 is still valid!
}</pre>
        <div class="insight-box" style="margin-top:8px;">A reference is like a pointer, but Rust guarantees it always points to a valid value — <strong>no dangling references</strong>, ever.</div>
      </div>
      <div class="content-section">
        <div class="content-label">The Two Borrowing Rules</div>
        <div class="insight-box" style="border-left-color:#6366f1;background:#f0f0ff;">
          <strong>Rule 1:</strong> You can have any number of <em>immutable</em> references (&T) at the same time.<br>
          <strong>Rule 2:</strong> OR you can have exactly ONE <em>mutable</em> reference (&mut T).<br>
          <strong>Never both simultaneously.</strong><br><br>
          Why: this is exactly what prevents data races. A data race requires concurrent access where at least one is a write. Rust's borrow rules make that impossible to compile.
        </div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">let mut s = String::from("hello");

// Multiple immutable refs — OK
let r1 = &s;
let r2 = &s;
println!("{r1} {r2}");   // both valid here

// Mutable reference — OK (once r1 and r2 are no longer used)
let r3 = &mut s;
r3.push_str(", world");
println!("{r3}");

// ILLEGAL — cannot mix:
// let r4 = &mut s;
// let r5 = &mut s;     // ERROR: cannot borrow s as mutable more than once
// println!("{r4} {r5}");

// ILLEGAL — cannot have mut and immutable at same time:
// let r1 = &s;
// let r2 = &mut s;     // ERROR: cannot borrow s as mutable because it is also borrowed as immutable</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Dangling References — Prevented at Compile Time</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// This would be a dangling pointer in C — Rust won't compile it:
fn dangle() -> &String {    // ERROR: missing lifetime specifier
    let s = String::from("hello");
    &s                       // s is dropped at end of this function!
}                            // reference would point to freed memory — REFUSED

// Correct: return the String itself (transfer ownership)
fn no_dangle() -> String {
    let s = String::from("hello");
    s                        // ownership moved to caller — valid
}</pre>
      </div>
      <div class="content-section">
        <div class="content-label">String Slices — &str</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">let s = String::from("hello world");

let hello: &str = &s[0..5];    // slice: reference to part of s
let world: &str = &s[6..11];   // indices are byte offsets
println!("{hello} {world}");

// String literals ARE slices — they're &str pointing into binary
let literal: &str = "hello";   // stored in the compiled binary

// Best practice: prefer &str over &String in function parameters
// &str can accept both String references and string literals
fn greet(name: &str) {
    println!("Hello, {name}!");
}
greet("Alice");                        // string literal — OK
greet(&String::from("Bob"));          // String reference — also OK</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: What is the difference between &String and &str?</strong></td><td>&String is a reference to a heap-allocated String. &str is a string slice — a reference to a UTF-8 string anywhere (heap, stack, or binary). Use &str in function parameters — it's more flexible (accepts both String and literals).</td></tr>
          <tr><td><strong>Q: Why can't I have two mutable references?</strong></td><td>Two mutable references in the same scope would allow two pieces of code to mutate the same data simultaneously — a data race. The borrow checker eliminates this class of bug entirely.</td></tr>
          <tr><td><strong>Q: What is NLL (Non-Lexical Lifetimes)?</strong></td><td>Modern Rust (since 2018) ends a borrow's lifetime at the last point it is used, not at the closing brace. So you can have an immutable borrow, use it, then take a mutable borrow — as long as the immutable borrow is no longer used.</td></tr>
        </table>
      </div>
    ` },

    // ── STEP 5 ──────────────────────────────────────────────
    { name: 'Structs & Enums', content: `
      <div class="content-section">
        <div class="content-label">Structs — Custom Data Types</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">#[derive(Debug, Clone, PartialEq)]   // auto-implement common traits
struct Rectangle {
    width:  f64,
    height: f64,
}

// Methods live in impl block
impl Rectangle {
    // Associated function (no self) — called like Rectangle::new()
    fn new(width: f64, height: f64) -> Self {
        Rectangle { width, height }   // field shorthand when name matches variable
    }

    // Method — takes &self (immutable borrow of the instance)
    fn area(&self) -> f64 {
        self.width * self.height
    }

    fn perimeter(&self) -> f64 {
        2.0 * (self.width + self.height)
    }

    fn is_square(&self) -> bool {
        (self.width - self.height).abs() < f64::EPSILON
    }

    // Mutable method — takes &mut self
    fn scale(&mut self, factor: f64) {
        self.width  *= factor;
        self.height *= factor;
    }
}

fn main() {
    let mut r = Rectangle::new(10.0, 5.0);
    println!("Area: {}", r.area());          // 50.0
    println!("Square? {}", r.is_square());   // false
    r.scale(2.0);
    println!("{:?}", r);   // Debug: Rectangle { width: 20.0, height: 10.0 }
}</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Enums — Model All Possibilities</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// Enums can carry data — each variant can have different data
#[derive(Debug)]
enum Message {
    Quit,                          // no data
    Move { x: i32, y: i32 },      // named fields (like a struct)
    Write(String),                 // single String
    ChangeColor(u8, u8, u8),       // three u8 values (RGB)
}

impl Message {
    fn describe(&self) {
        match self {
            Message::Quit              => println!("Quit"),
            Message::Move { x, y }    => println!("Move to ({x},{y})"),
            Message::Write(text)       => println!("Write: {text}"),
            Message::ChangeColor(r,g,b)=> println!("Color: {r},{g},{b}"),
        }
    }
}

// Option<T> — the standard way to handle "maybe no value" (no null!)
let some_val: Option<i32> = Some(42);
let no_val:   Option<i32> = None;

let doubled = some_val.map(|v| v * 2);   // Some(84)
let value = some_val.unwrap_or(0);        // 42
let safe  = no_val.unwrap_or(0);          // 0  (no panic)</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: Can a struct own another struct?</strong></td><td>Yes. The outer struct owns the inner — when outer is dropped, inner is dropped too. If you need shared ownership, use Rc or Arc.</td></tr>
          <tr><td><strong>Q: What is #[derive] doing?</strong></td><td>It's a procedural macro that auto-generates trait implementations. #[derive(Debug)] generates the fmt::Debug implementation. #[derive(Clone)] generates clone(). You can only derive traits that provide a derivable implementation.</td></tr>
          <tr><td><strong>Q: How does Rust's Option compare to null?</strong></td><td>null can appear anywhere in C/Java without warning — the billion-dollar mistake. Rust's Option is explicit in the type system. A function that might return nothing returns Option&lt;T&gt;, not T. The compiler forces you to handle the None case before using the value.</td></tr>
        </table>
      </div>
    ` },

    // ── STEP 6 ──────────────────────────────────────────────
    { name: 'Pattern Matching', content: `
      <div class="content-section">
        <div class="content-label">match — Exhaustive Switch on Steroids</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// match is exhaustive — must cover EVERY possible value
let n = 7u32;
let description = match n {
    1       => "one",
    2 | 3   => "two or three",          // multiple patterns with |
    4..=6   => "four through six",      // inclusive range
    7       => "seven",
    _       => "something else",        // wildcard — catches everything else
};

// Match on a Result
let result: Result<i32, &str> = Ok(42);
match result {
    Ok(val)  => println!("Got: {val}"),
    Err(msg) => println!("Error: {msg}"),
}

// Match on an enum with data — destructure inside the arm
enum Coin { Penny, Nickel, Dime, Quarter(String) }
let coin = Coin::Quarter(String::from("Alaska"));
let cents = match coin {
    Coin::Penny            => 1,
    Coin::Nickel           => 5,
    Coin::Dime             => 10,
    Coin::Quarter(state)   => { println!("State: {state}"); 25 },
};

// Match guards — extra conditions
let pair = (2, -2);
match pair {
    (x, y) if x == y     => println!("equal"),
    (x, y) if x + y == 0 => println!("opposites"),
    (x, _)               => println!("x is {x}"),
}

// @ bindings — capture AND test
let n = 15;
match n {
    x @ 1..=12  => println!("month {x}"),
    x @ 13..=19 => println!("teen {x}"),
    x           => println!("other {x}"),
}</pre>
      </div>
      <div class="content-section">
        <div class="content-label">if let and while let — Concise Patterns</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// if let: match one pattern, ignore others
let opt: Option<u8> = Some(7);

if let Some(val) = opt {           // only runs if opt is Some
    println!("Value is {val}");
} else {
    println!("Nothing here");
}

// while let: loop while pattern matches
let mut stack = vec![1, 2, 3];
while let Some(top) = stack.pop() {  // stops when pop() returns None
    println!("{top}");               // prints 3, 2, 1
}

// Destructuring in let itself
let (a, b, c) = (1, 2, 3);
let Rectangle { width, height } = Rectangle::new(10.0, 5.0);

// Destructuring function parameters
fn print_point(&(x, y): &(i32, i32)) {
    println!("({x},{y})");
}</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: What happens if I forget a match arm?</strong></td><td>Compile error: "non-exhaustive patterns". Rust guarantees at compile time that every possible value is handled. This is one of Rust's biggest ergonomic wins over switch/case in C.</td></tr>
          <tr><td><strong>Q: Can match arms return different types?</strong></td><td>No — all arms must return the same type. The match expression has one type. If some arms produce a value and one arm never returns (using panic! or return), that arm's type is the "never" type (!) which coerces to any type.</td></tr>
          <tr><td><strong>Q: When to use if let vs match?</strong></td><td>if let when you care about exactly one pattern. match when you need to handle multiple variants, especially when exhaustiveness is important (ensures you don't miss a case when the enum gains a new variant).</td></tr>
        </table>
      </div>
    ` },

    // ── STEP 7 ──────────────────────────────────────────────
    { name: 'Functions, Closures & Iterators', content: `
      <div class="content-section">
        <div class="content-label">Functions</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// Return type after ->
fn add(a: i32, b: i32) -> i32 {
    a + b   // NO semicolon = expression = return value
}           // semicolon would make it a statement returning ()

// Multiple returns via tuple
fn min_max(v: &[i32]) -> (i32, i32) {
    let min = *v.iter().min().unwrap();
    let max = *v.iter().max().unwrap();
    (min, max)
}
let (lo, hi) = min_max(&[3,1,4,1,5,9]);

// Early return with return keyword
fn divide(a: f64, b: f64) -> Option<f64> {
    if b == 0.0 { return None; }
    Some(a / b)
}</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Closures — Anonymous Functions That Capture Environment</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// Basic closure: |params| expression
let add = |a, b| a + b;         // types inferred
println!("{}", add(2, 3));      // 5

// Capture by reference (borrows environment)
let x = 5;
let add_x = |n| n + x;         // x is borrowed from outer scope
println!("{}", add_x(10));      // 15 — x is still accessible

// move closure — takes ownership of captured variables
let s = String::from("hello");
let greeting = move || println!("{s}");  // s is MOVED into the closure
greeting();
// println!("{s}");  // ERROR: s was moved

// Three closure traits:
// Fn     — borrows immutably, can be called many times
// FnMut  — borrows mutably, can be called many times
// FnOnce — takes ownership, can only be called ONCE (consuming closures)</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Iterators — Lazy, Zero-cost Pipelines</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Iterator pipeline — NOTHING runs until collect() / sum() / etc.
let result: Vec<i32> = numbers.iter()
    .filter(|&&n| n % 2 == 0)        // keep evens: 2,4,6,8,10
    .map(|&n| n * n)                  // square each: 4,16,36,64,100
    .collect();                        // consume into Vec

// Common adapters:
numbers.iter().map(|&n| n * 2);           // transform each
numbers.iter().filter(|&&n| n > 5);       // keep matching
numbers.iter().flat_map(|&n| vec![n, n]); // flatten nested
numbers.iter().take(3);                    // first 3
numbers.iter().skip(3);                    // drop first 3
numbers.iter().enumerate();                // (index, &value) pairs
numbers.iter().zip([10,20,30].iter());     // pair with another

// Common consumers (trigger evaluation):
let sum: i32 = numbers.iter().sum();                  // 55
let count = numbers.iter().filter(|&&n|n>5).count();  // 5
let any_big = numbers.iter().any(|&n| n > 9);         // true
let all_pos = numbers.iter().all(|&n| n > 0);         // true
let first_even = numbers.iter().find(|&&n| n%2==0);   // Some(&2)
let total = numbers.iter().fold(0, |acc, &n| acc + n);// 55

// Real example: process users
struct User { name: String, age: u32, active: bool }
let users: Vec<User> = get_users();
let active_names: Vec<&str> = users.iter()
    .filter(|u| u.active && u.age >= 18)
    .map(|u| u.name.as_str())
    .collect();</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Custom Iterator</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">struct Counter { count: u32, max: u32 }

impl Counter {
    fn new(max: u32) -> Self { Counter { count: 0, max } }
}

impl Iterator for Counter {
    type Item = u32;
    fn next(&mut self) -> Option<u32> {
        if self.count < self.max {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }
    }
}

// Now Counter has ALL iterator methods for free:
let sum: u32 = Counter::new(5).sum();   // 15
let pairs: Vec<_> = Counter::new(3).zip(Counter::new(3).skip(1)).collect();</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: Are iterator chains slower than for loops?</strong></td><td>No — Rust's iterators are a zero-cost abstraction. The compiler inlines and optimises the chain into the same machine code as a hand-written loop. Often they're faster due to LLVM optimisations enabled by the functional structure.</td></tr>
          <tr><td><strong>Q: What is the difference between iter(), iter_mut(), and into_iter()?</strong></td><td>iter() yields &T (immutable references). iter_mut() yields &mut T (mutable references). into_iter() consumes the collection and yields T (owned values). Use into_iter() when you no longer need the original collection.</td></tr>
        </table>
      </div>
    ` },

    // ── STEP 8 ──────────────────────────────────────────────
    { name: 'Error Handling', content: `
      <div class="content-section">
        <div class="content-label">No Exceptions — Errors Are Values</div>
        <div class="insight-box" style="border-left-color:#ef4444;background:#fff5f5;">
          Rust has no try/catch. Errors are returned as values — the type system forces you to handle them. This makes error paths explicit and prevents silent failures.
          <br><br>
          <strong>Option&lt;T&gt;</strong> — value might not exist (null safety)<br>
          <strong>Result&lt;T, E&gt;</strong> — operation might fail with an error
        </div>
      </div>
      <div class="content-section">
        <div class="content-label">Result&lt;T, E&gt; — Recoverable Errors</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">use std::fs;
use std::num::ParseIntError;

// Functions that can fail return Result
fn parse_number(s: &str) -> Result<i32, ParseIntError> {
    s.trim().parse::<i32>()   // returns Ok(n) or Err(ParseIntError)
}

// Handle with match
match parse_number("42") {
    Ok(n)  => println!("Parsed: {n}"),
    Err(e) => println!("Failed: {e}"),
}

// Handle with combinators
let doubled = parse_number("21")
    .map(|n| n * 2)               // Ok(42) — transform the Ok value
    .unwrap_or(0);                // if Err, use 0

let chained = parse_number("5")
    .and_then(|n| if n > 0 { Ok(n * 10) } else { Err("negative".parse::<i32>().unwrap_err()) });

// unwrap() — panics on Err (use only in tests / prototyping)
let n = parse_number("7").unwrap();

// expect() — panics with a custom message (better than unwrap in production)
let n = parse_number("7").expect("config file must contain a valid port number");</pre>
      </div>
      <div class="content-section">
        <div class="content-label">The ? Operator — Propagate Errors Upward</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">use std::fs;
use std::io;

// Without ? — verbose
fn read_file_verbose(path: &str) -> Result<String, io::Error> {
    let content = match fs::read_to_string(path) {
        Ok(s)  => s,
        Err(e) => return Err(e),
    };
    Ok(content.to_uppercase())
}

// With ? — clean and idiomatic
fn read_file(path: &str) -> Result<String, io::Error> {
    let content = fs::read_to_string(path)?;  // returns Err early if it fails
    Ok(content.to_uppercase())
}

// Chain multiple ? — entire pipeline, any failure bubbles up
fn process(path: &str) -> Result<i32, Box<dyn std::error::Error>> {
    let content  = fs::read_to_string(path)?;     // io::Error?
    let trimmed  = content.trim();
    let number   = trimmed.parse::<i32>()?;        // ParseIntError?
    Ok(number * 2)
}

// main() can return Result too!
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let n = process("number.txt")?;
    println!("Result: {n}");
    Ok(())
}</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Custom Error Types</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">use std::fmt;

#[derive(Debug)]
enum AppError {
    Io(std::io::Error),
    Parse(std::num::ParseIntError),
    InvalidInput(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            AppError::Io(e)            => write!(f, "IO error: {e}"),
            AppError::Parse(e)         => write!(f, "Parse error: {e}"),
            AppError::InvalidInput(s)  => write!(f, "Invalid input: {s}"),
        }
    }
}

// From implementations let ? auto-convert error types
impl From<std::io::Error> for AppError {
    fn from(e: std::io::Error) -> Self { AppError::Io(e) }
}
impl From<std::num::ParseIntError> for AppError {
    fn from(e: std::num::ParseIntError) -> Self { AppError::Parse(e) }
}

// Now ? converts io::Error and ParseIntError to AppError automatically
fn load_config(path: &str) -> Result<i32, AppError> {
    let content = std::fs::read_to_string(path)?;   // io::Error -> AppError via From
    let port    = content.trim().parse::<i32>()?;   // ParseIntError -> AppError via From
    if port < 1024 { return Err(AppError::InvalidInput("port too low".into())); }
    Ok(port)
}</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: When should I use unwrap()?</strong></td><td>Only in: tests (panic is fine), examples/prototyping, situations where you are logically certain it cannot be None/Err (and you can justify it with a comment). In production code, prefer ? or explicit match.</td></tr>
          <tr><td><strong>Q: What is Box&lt;dyn Error&gt;?</strong></td><td>A heap-allocated trait object that can hold ANY error type implementing the Error trait. Useful when a function can return multiple different error types. The trade-off: dynamic dispatch (slightly slower) and you lose the concrete type info at the call site.</td></tr>
          <tr><td><strong>Q: What is the anyhow crate?</strong></td><td>anyhow::Result is a convenience wrapper around Box&lt;dyn Error&gt; with better ergonomics. Use it for application code where you just want to propagate errors. Use thiserror for library code where you want precise, typed errors that callers can match on.</td></tr>
        </table>
      </div>
    ` },

    // ── STEP 9 ──────────────────────────────────────────────
    { name: 'Traits & Generics', content: `
      <div class="content-section">
        <div class="content-label">Traits — Shared Behaviour</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// Define a trait
trait Summary {
    fn summarise(&self) -> String;             // required method
    fn preview(&self) -> String {              // default method
        format!("{}...", &self.summarise()[..50])
    }
}

struct Article { title: String, content: String }
struct Tweet   { username: String, text: String }

impl Summary for Article {
    fn summarise(&self) -> String {
        format!("{}: {}", self.title, self.content)
    }
}

impl Summary for Tweet {
    fn summarise(&self) -> String {
        format!("{}: {}", self.username, self.text)
    }
    // preview() uses the default implementation
}

// Trait as function parameter — either syntax works:
fn notify(item: &impl Summary) {                       // impl Trait syntax
    println!("{}", item.summarise());
}
fn notify_generic<T: Summary>(item: &T) {             // trait bound syntax
    println!("{}", item.summarise());
}
// They're equivalent. impl Trait is cleaner for single params.

// Multiple bounds
fn display_and_summarise<T: Summary + std::fmt::Display>(item: &T) { }

// Where clause — for complex bounds
fn complex<T, U>(t: &T, u: &U)
where
    T: Summary + Clone,
    U: std::fmt::Display + std::fmt::Debug,
{ }</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Generics — Write Once, Work For All Types</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// Generic function — works for any T that implements PartialOrd
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest { largest = item; }
    }
    largest
}
let nums = vec![34, 50, 25, 100, 65];
println!("{}", largest(&nums));      // 100

// Generic struct
struct Pair<T> { first: T, second: T }
impl<T: std::fmt::Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {
        if self.first >= self.second {
            println!("First: {}", self.first);
        } else {
            println!("Second: {}", self.second);
        }
    }
}

// MONOMORPHIZATION: Rust compiles a separate concrete version for each type used.
// largest::<i32> and largest::<f64> are separate functions in the binary.
// Zero runtime overhead — generics in Rust are free.</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Trait Objects — Dynamic Dispatch</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// When you need a collection of different types that share a trait:
let items: Vec<Box<dyn Summary>> = vec![
    Box::new(Article { title: "Rust".into(), content: "...".into() }),
    Box::new(Tweet   { username: "alice".into(), text: "...".into() }),
];
for item in &items {
    println!("{}", item.summarise());   // dynamic dispatch — resolved at runtime
}

// &dyn Trait vs &impl Trait:
// &impl Trait — static dispatch (monomorphization), zero overhead, known at compile time
// &dyn Trait  — dynamic dispatch (vtable), slight overhead, type known only at runtime</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Common Standard Library Traits</div>
        <table class="nfr-table">
          <tr><td><strong>Display</strong></td><td>Custom fmt for user-facing output: <code>println!("{}", val)</code>. Implement fmt::Display.</td></tr>
          <tr><td><strong>Debug</strong></td><td>Dev/debug output: <code>println!("{:?}", val)</code>. Derivable with #[derive(Debug)].</td></tr>
          <tr><td><strong>Clone / Copy</strong></td><td>Clone: explicit deep copy. Copy: implicit bit copy for stack types.</td></tr>
          <tr><td><strong>PartialEq / Eq</strong></td><td>== and != operators. Eq adds total equality (no NaN). Derivable.</td></tr>
          <tr><td><strong>PartialOrd / Ord</strong></td><td>&lt;, &gt;, &lt;=, &gt;= operators. Ord adds total ordering (for sorting).</td></tr>
          <tr><td><strong>Iterator</strong></td><td>Implement next() — get all iterator adapters for free.</td></tr>
          <tr><td><strong>From / Into</strong></td><td>Type conversions. From&lt;T&gt; auto-provides Into&lt;T&gt;. The ? operator uses From.</td></tr>
          <tr><td><strong>Default</strong></td><td>Zero-value for a type. String::default() = "", i32::default() = 0. Derivable.</td></tr>
        </table>
      </div>
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: Can a type implement the same trait multiple times?</strong></td><td>No — one implementation per trait per type (for a given set of type parameters). You can implement a trait for many types, and many traits for one type, but not the same trait twice for the same type.</td></tr>
          <tr><td><strong>Q: What is "orphan rule" / coherence?</strong></td><td>You can only implement a trait for a type if either the trait OR the type is defined in your crate. You cannot implement Display for Vec&lt;i32&gt; in your crate because both Display and Vec are from std. This prevents conflicting implementations across crates.</td></tr>
        </table>
      </div>
    ` },

    // ── STEP 10 ──────────────────────────────────────────────
    { name: 'Collections', content: `
      <div class="content-section">
        <div class="content-label">Vec&lt;T&gt; — Growable Array</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">let mut v: Vec<i32> = Vec::new();
let mut v = vec![1, 2, 3];            // macro shorthand

v.push(4);                             // append
v.push(5);
let last = v.pop();                    // Some(5) — removes last
let first = &v[0];                     // &1 — panics if out of bounds
let safe  = v.get(0);                  // Some(&1) — returns Option

// Slicing
let slice = &v[1..3];                  // &[2, 3]

// Iteration
for n in &v      { println!("{n}"); }  // immutable borrow
for n in &mut v  { *n *= 2; }          // mutable borrow — modify in place
for n in v       { println!("{n}"); }  // consuming — v moved, no longer valid

// Useful methods
v.sort();                          // sort in place (requires Ord)
v.sort_by(|a, b| b.cmp(a));       // reverse sort
v.dedup();                         // remove consecutive duplicates (sort first!)
v.retain(|&n| n > 0);             // keep only elements matching predicate
v.extend([10, 20, 30]);           // append from iterator
let joined: Vec<_> = v.iter().chain([99].iter()).collect();

// Capacity pre-allocation (performance tip)
let mut v = Vec::with_capacity(1000);  // allocate once, push without reallocation</pre>
      </div>
      <div class="content-section">
        <div class="content-label">HashMap&lt;K, V&gt;</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">use std::collections::HashMap;

let mut scores: HashMap<String, i32> = HashMap::new();
scores.insert(String::from("Alice"), 100);
scores.insert(String::from("Bob"), 85);

// Access
let alice = scores.get("Alice");             // Option<&i32> — Some(&100)
let alice = scores["Alice"];                  // i32 — panics if missing

// Contains check
scores.contains_key("Alice");                 // true

// Entry API — most idiomatic pattern
scores.entry(String::from("Charlie")).or_insert(0);  // insert 0 if absent
*scores.entry(String::from("Alice")).or_insert(0) += 10;  // Alice: 110

// Frequency counter — classic pattern
let text = "hello world hello rust world";
let mut freq: HashMap<&str, u32> = HashMap::new();
for word in text.split_whitespace() {
    let count = freq.entry(word).or_insert(0);
    *count += 1;
}
// freq: {"hello": 2, "world": 2, "rust": 1}

// Iteration
for (key, val) in &scores {
    println!("{key}: {val}");
}

// Collect from iterator
let map: HashMap<&str, i32> = [("a", 1), ("b", 2)].iter().cloned().collect();</pre>
      </div>
      <div class="content-section">
        <div class="content-label">HashSet&lt;T&gt; and When to Use What</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">use std::collections::HashSet;

let mut set: HashSet<i32> = HashSet::new();
set.insert(1); set.insert(2); set.insert(3);
set.insert(2);                    // duplicate — ignored
println!("{}", set.len());        // 3

set.contains(&2);                 // true
set.remove(&2);

// Set operations
let a: HashSet<i32> = [1,2,3,4].iter().cloned().collect();
let b: HashSet<i32> = [3,4,5,6].iter().cloned().collect();
let union:        Vec<_> = a.union(&b).collect();        // 1,2,3,4,5,6
let intersection: Vec<_> = a.intersection(&b).collect(); // 3,4
let difference:   Vec<_> = a.difference(&b).collect();   // 1,2</pre>
        <table class="nfr-table" style="margin-top:12px;">
          <tr><td><strong>Vec&lt;T&gt;</strong></td><td>Ordered, duplicates allowed, fast index access. Use for: lists, stacks, queues.</td></tr>
          <tr><td><strong>HashMap&lt;K,V&gt;</strong></td><td>Key-value store, O(1) average lookup. Use for: caches, counters, grouping.</td></tr>
          <tr><td><strong>HashSet&lt;T&gt;</strong></td><td>Unique values, O(1) membership test. Use for: deduplication, set operations.</td></tr>
          <tr><td><strong>BTreeMap&lt;K,V&gt;</strong></td><td>Like HashMap but sorted by key, O(log n). Use when you need ordered iteration.</td></tr>
          <tr><td><strong>VecDeque&lt;T&gt;</strong></td><td>Double-ended queue. O(1) push/pop at front AND back. Use for: BFS, sliding window.</td></tr>
        </table>
      </div>
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: Why does HashMap require keys to implement Hash + Eq?</strong></td><td>HashMap uses hashing to find the bucket. Hash computes the hash code. Eq resolves collisions (two different values can have the same hash). Both are needed for correct, efficient lookup.</td></tr>
          <tr><td><strong>Q: Is Vec reallocated when it grows?</strong></td><td>Yes — when push() exceeds capacity, Vec allocates a new buffer (typically 2× the current capacity), copies all elements, and frees the old buffer. Use Vec::with_capacity() to pre-allocate and avoid repeated reallocations.</td></tr>
        </table>
      </div>
    ` },

    // ── STEP 11 ──────────────────────────────────────────────
    { name: 'Lifetimes', content: `
      <div class="content-section">
        <div class="content-label">Why Lifetimes Exist</div>
        <div class="insight-box" style="border-left-color:#6366f1;background:#f0f0ff;">
          Lifetimes are how the borrow checker tracks <em>how long</em> a reference is valid. They don't change how long something lives — they describe <em>relationships</em> between the lifetimes of references.
          <br><br>
          The compiler uses lifetime annotations to prove that no reference ever outlives the data it points to. If it can't prove this, it refuses to compile.
        </div>
      </div>
      <div class="content-section">
        <div class="content-label">The Problem Lifetimes Solve</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// The compiler can't figure out which reference we return:
fn longest(x: &str, y: &str) -> &str {   // ERROR: missing lifetime specifier
    if x.len() > y.len() { x } else { y }
}
// Why? Because the returned reference might be x OR y.
// The compiler needs to know: "the returned reference lives as long as what?"

// Fix: lifetime annotation 'a
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
// 'a means: "both inputs and the output all live at least as long as 'a"
// In practice: output lives as long as the SHORTER-lived input

fn main() {
    let s1 = String::from("long string");
    let result;
    {
        let s2 = String::from("xyz");
        result = longest(s1.as_str(), s2.as_str());
        println!("{result}");   // OK — result used within s2's scope
    }
    // println!("{result}");   // ERROR — s2 dropped, result might point to s2
}</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Lifetime Elision — When You Don't Write Them</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// The compiler can infer lifetimes in many cases (elision rules):

// Rule 1: each reference param gets its own lifetime
fn first_word(s: &str) -> &str { ... }
// is equivalent to:
fn first_word<'a>(s: &'a str) -> &'a str { ... }

// Rule 2: if there's exactly one input lifetime, it applies to all outputs
fn identity(s: &str) -> &str { s }
// Compiler infers: fn identity<'a>(s: &'a str) -> &'a str

// Rule 3: if one param is &self or &mut self, its lifetime applies to outputs
impl MyType {
    fn method(&self, s: &str) -> &str { self.name.as_str() }
    // Compiler infers: fn method<'a, 'b>(&'a self, s: &'b str) -> &'a str
}

// Lifetime in structs — the struct can't outlive the reference it holds
struct Important<'a> {
    content: &'a str,   // borrows a string slice
}
let novel = String::from("Call me Ishmael...");
let i = Important { content: novel.split('.').next().unwrap() };
// i cannot outlive novel</pre>
      </div>
      <div class="content-section">
        <div class="content-label">The 'static Lifetime</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">// 'static = lives for the entire duration of the program
let s: &'static str = "hello";   // string literals are always 'static
// They live in the compiled binary — always valid

// You'll see 'static in error messages when the compiler can't
// prove a reference lives long enough. It's asking for data that
// definitely outlives the current scope.
// Solution: don't fight it — restructure to use owned types (String, Vec) instead.</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: Do I need to write lifetime annotations often?</strong></td><td>Less than you think — elision rules handle most cases. You'll mainly need them in: functions returning references when there are multiple input references, structs that hold references, and complex trait implementations.</td></tr>
          <tr><td><strong>Q: The error says "does not live long enough" — what does that mean?</strong></td><td>A reference is being used after the value it points to has been dropped. The borrow checker detected that the reference's lifetime exceeds the referent's lifetime. Fix: move the value to a wider scope, or return owned data instead of a reference.</td></tr>
          <tr><td><strong>Q: Can lifetime annotations change performance?</strong></td><td>No — lifetime annotations are purely compile-time information. They generate zero machine code. They exist only to let the compiler verify memory safety. Zero runtime cost.</td></tr>
        </table>
      </div>
    ` },

    // ── STEP 12 ──────────────────────────────────────────────
    { name: 'Concurrency', content: `
      <div class="content-section">
        <div class="content-label">Fearless Concurrency</div>
        <div class="insight-box" style="border-left-color:#10b981;background:#f0fdf4;">
          In most languages, concurrency bugs (data races, deadlocks) are runtime problems that appear intermittently in production. In Rust, <strong>data races are a compile-time error</strong>. The ownership + type system prevents sharing mutable state across threads unsafely.
        </div>
      </div>
      <div class="content-section">
        <div class="content-label">Spawning Threads</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">use std::thread;
use std::time::Duration;

let handle = thread::spawn(|| {        // closure runs in a new OS thread
    for i in 1..=5 {
        println!("Thread: {i}");
        thread::sleep(Duration::from_millis(50));
    }
});

for i in 1..=3 {
    println!("Main: {i}");
    thread::sleep(Duration::from_millis(80));
}

handle.join().unwrap();  // wait for thread to finish

// move closure — thread takes ownership of captured data
let data = vec![1, 2, 3];
let handle = thread::spawn(move || {   // data MOVED into thread
    println!("{:?}", data);
});
handle.join().unwrap();
// data no longer accessible here</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Arc&lt;T&gt; + Mutex&lt;T&gt; — Shared Mutable State</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">use std::sync::{Arc, Mutex};
use std::thread;

// Arc: Atomic Reference Counter — shared ownership across threads
// Mutex: Mutual exclusion — only one thread accesses data at a time

let counter = Arc::new(Mutex::new(0));  // shared, mutable counter
let mut handles = vec![];

for _ in 0..10 {
    let counter = Arc::clone(&counter); // clone the Arc (increments ref count)
    let handle = thread::spawn(move || {
        let mut num = counter.lock().unwrap(); // acquire lock — blocks until available
        *num += 1;
    }); // lock released here (MutexGuard dropped)
    handles.push(handle);
}

for h in handles { h.join().unwrap(); }
println!("Counter: {}", *counter.lock().unwrap()); // 10</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Channels — Message Passing</div>
        <pre style="background:#1e1e2e;color:#e2e8f0;font-family:'SF Mono','Courier New',monospace;font-size:12.5px;padding:16px;border-radius:8px;line-height:1.9;overflow-x:auto;margin:10px 0;">use std::sync::mpsc;  // multiple producer, single consumer
use std::thread;

let (tx, rx) = mpsc::channel();

// Sender in another thread
let tx_clone = tx.clone();   // multiple producers
thread::spawn(move || {
    tx.send(String::from("hello")).unwrap();
    tx.send(String::from("world")).unwrap();
    // tx dropped here — channel closes
});

thread::spawn(move || {
    tx_clone.send(String::from("from clone")).unwrap();
});

// Receiver blocks until message arrives or channel closes
for received in rx {   // iterates until all senders dropped
    println!("Got: {received}");
}

// Non-blocking receive
match rx.try_recv() {
    Ok(msg)  => println!("Got: {msg}"),
    Err(_)   => println!("No message yet"),
}</pre>
      </div>
      <div class="content-section">
        <div class="content-label">Send and Sync Marker Traits</div>
        <table class="nfr-table">
          <tr><td><strong>Send</strong></td><td>A type is Send if it is safe to transfer ownership to another thread. Almost all types are Send. Rc&lt;T&gt; is NOT Send (reference count is not atomic). Arc&lt;T&gt; IS Send.</td></tr>
          <tr><td><strong>Sync</strong></td><td>A type is Sync if it is safe for multiple threads to hold a reference to it simultaneously. &T is Send if T: Sync. Mutex&lt;T&gt; is Sync even if T is not (because the mutex enforces exclusive access).</td></tr>
        </table>
        <div class="insight-box" style="margin-top:10px;">
          These are <em>marker traits</em> — no methods to implement. The compiler auto-implements them. If you try to send an Rc (not Send) across threads, <strong>it refuses to compile</strong>. This is fearless concurrency: the type system catches concurrency bugs before runtime.
        </div>
      </div>
      <div class="content-section">
        <div class="content-label">Cross Q&amp;A</div>
        <table class="nfr-table">
          <tr><td><strong>Q: Mutex vs RwLock — when to use which?</strong></td><td>Mutex: one writer OR one reader at a time. RwLock: one writer OR many readers. Use RwLock for read-heavy workloads where concurrent reads are common and writes are rare. Mutex is simpler and has lower overhead when writes are frequent.</td></tr>
          <tr><td><strong>Q: What is a deadlock and can Rust prevent it?</strong></td><td>Deadlock: thread A holds lock 1 and waits for lock 2; thread B holds lock 2 and waits for lock 1 — both stuck forever. Rust prevents data races but NOT deadlocks — deadlock is a logic bug. Use consistent lock ordering, or parking_lot crate's try_lock with timeout.</td></tr>
          <tr><td><strong>Q: Arc&lt;Mutex&lt;T&gt;&gt; vs channels — when to use each?</strong></td><td>Channels (message passing): prefer when you can model as sending data between workers. Cleaner ownership story — sender gives up data, receiver owns it. Arc&lt;Mutex&gt;: prefer when multiple threads legitimately share state (e.g. a shared cache). Channels are generally easier to reason about.</td></tr>
          <tr><td><strong>Q: What is Rayon?</strong></td><td>A data parallelism crate. Replace .iter() with .par_iter() and your iterator chain runs across all CPU cores automatically. Rayon handles work-stealing thread pools. Best for CPU-bound, embarrassingly parallel workloads (sorting large vecs, matrix ops, image processing).</td></tr>
        </table>
      </div>
    ` },

  ] // end steps
};

export const languageSystems = { rust };
