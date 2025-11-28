# Fly.io Deployment Guide

## Setting Stack Auth Environment Variables

Stack Auth environment variables must be set as **build-time secrets** in Fly.io because Vite embeds `VITE_*` variables into the client bundle during build.

### Set the secrets (build-time):

```bash
# Set Stack Auth credentials as build secrets
fly secrets set VITE_STACK_PROJECT_ID=your_project_id_here
fly secrets set VITE_STACK_PUBLISHABLE_CLIENT_KEY=your_publishable_key_here
```

### Deploy the app (secrets are injected at build time):

```bash
fly deploy
```

### Complete Deployment Steps:

1. **Get your Stack Auth credentials** from https://app.stack-auth.com
   - Project ID
   - Publishable Client Key

2. **Provide build-time secrets directly on deploy (runtime secrets are NOT available during build)**:
   Option A (recommended – uses Docker build secrets):
   ```bash
   fly deploy \
     --build-secret VITE_STACK_PROJECT_ID=proj_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
     --build-secret VITE_STACK_PUBLISHABLE_CLIENT_KEY=pk_xxxxxxxxxxxxxxxxx
   ```

   Option B (if you are comfortable exposing values as plain build args – they are public identifiers):
   ```bash
   fly deploy \
     --build-arg VITE_STACK_PROJECT_ID=proj_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx \
     --build-arg VITE_STACK_PUBLISHABLE_CLIENT_KEY=pk_xxxxxxxxxxxxxxxxx
   ```

3. **(Optional) Also set runtime secrets** (for future server-side use; not required for Vite embedding):
   ```bash
   fly secrets set VITE_STACK_PROJECT_ID=proj_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   fly secrets set VITE_STACK_PUBLISHABLE_CLIENT_KEY=pk_xxxxxxxxxxxxxxxxx
   ```

4. **Redeploy whenever you change these values** (client bundle must be rebuilt).

The Dockerfile and fly.toml are already configured to:
- Accept these as build arguments
- Pass them to the Vite build process
- Embed them in the client bundle

## Important Notes

1. **Build-time vs Runtime**: `VITE_*` environment variables are embedded at **build time**, not runtime. This means:
   - They must be available when running `npm run build` in the Docker container
   - Changing them requires a rebuild and redeploy
   - They are baked into the client JavaScript bundle

2. **Finding Your Stack Auth Credentials**:
   - Go to https://app.stack-auth.com
   - Select your project
   - Find your Project ID and Publishable Client Key in the project settings

3. **Security**: The publishable client key is safe to expose in client-side code (it's public by design). Never expose your secret key.

## Troubleshooting

If you see "Welcome to Stack Auth! It seems that you haven't provided a project ID":
- Verify secrets are set: `fly secrets list`
- Check build logs: `fly logs` - look for the Vite build output
- Ensure you're deploying after setting secrets (secrets require rebuild)

If you see "Invalid project ID: ${VITE_STACK_PROJECT_ID}":
- The literal string was embedded because no build-secret or build-arg supplied at build time.
- Solution: redeploy using `fly deploy --build-secret ...` or `--build-arg ...`.
- Verify the Dockerfile contains the secret mount RUN line.
