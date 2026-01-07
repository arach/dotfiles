# /npm-publish - Publish npm Package

Publish an npm package with automatic OTP from 1Password.

## Instructions

When the user runs `/npm-publish`:

1. **Verify package.json exists** in the current directory

2. **Check package details**:
   ```bash
   cat package.json | grep -E '"name"|"version"|"private"'
   ```
   - Confirm the package name and version
   - Abort if `"private": true`

3. **Run npm publish**:
   ```bash
   npm publish --access public --otp=$(op item get "npmjs [2fa]" --otp)
   ```

4. **Report the result**:
   - On success: Show the published package name and version
   - On failure: Show the error and suggest fixes

## Example Usage

```
User: /npm-publish
Assistant: Publishing package...
  Name: @arach/my-package
  Version: 1.0.0

Running: npm publish --access public --otp=$(op item get "npmjs [2fa]" --otp)

Published @arach/my-package@1.0.0 successfully.
```

## Notes

- Requires 1Password CLI (`op`) to be installed and authenticated
- The OTP item must be named "npmjs [2fa]" in 1Password
- Uses `--access public` for scoped packages
