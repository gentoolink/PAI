# Capture Learning Command

This command captures a problem-solving narrative and saves it as a learning in `~/.claude/context/learnings/`.

## Usage

The command can be run interactively or with arguments.

### Interactive Mode

```bash
bun ~/.claude/commands/capture-learning.ts
```

The script will prompt you for:
- The problem encountered
- Your initial assumption
- The actual reality you discovered
- The troubleshooting steps you took
- The final solution
- The key takeaway

### Argument-based Mode

You can also provide the information as command-line arguments:

```bash
bun ~/.claude/commands/capture-learning.ts "[problem]" "[initial_assumption]" "[actual_reality]" "[troubleshooting_steps]" "[solution]" "[takeaway]"
```

## Implementation

The logic is handled by the `capture-learning.ts` script in this same directory. This separation of documentation (`.md`) and implementation (`.ts`) is the current best practice for PAI commands.