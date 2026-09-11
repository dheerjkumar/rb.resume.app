FROM node:22-bookworm-slim

# Install strictly the minimal LaTeX dependencies needed by classic_ats.tex
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-latex-recommended \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application source
COPY . .

# Ensure temp directory exists for PDF generation
RUN mkdir -p tmp_pdf && chmod 777 tmp_pdf

# Expose port and start
EXPOSE 5000
CMD ["node", "index.js"]
