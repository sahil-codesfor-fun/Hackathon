import { NextResponse } from 'next/server';

const OC_API_KEY = 'oc_44kd2fqud_44kd2fquy_35e785254f2a50395a7997c520eaaf03692036724ccc7902';

export async function POST(request) {
  try {
    const { language, code, stdin } = await request.json();

    if (!language || !code) {
      return NextResponse.json(
        { error: 'Language and code are required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://api.onecompiler.com/v1/run?access_token=${OC_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          stdin: stdin || '',
          files: [
            {
              name: getFileName(language),
              content: code,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    // OneCompiler returns 200 even for failed runs; check status field
    if (data.status === 'failed' || data.error) {
      return NextResponse.json({
        stdout: '',
        stderr: data.error || 'Compilation failed',
        error: data.error || '',
        exception: data.exception || '',
        executionTime: null,
      });
    }

    return NextResponse.json({
      stdout: data.stdout || '',
      stderr: data.stderr || '',
      error: '',
      exception: data.exception || '',
      executionTime: data.executionTime || null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', stderr: err.message },
      { status: 500 }
    );
  }
}

function getFileName(language) {
  const map = {
    python: 'main.py',
    java: 'Main.java',
    c: 'main.c',
    cpp: 'main.cpp',
    javascript: 'index.js',
    typescript: 'index.ts',
    go: 'main.go',
    rust: 'main.rs',
    ruby: 'main.rb',
    php: 'index.php',
    csharp: 'Program.cs',
    kotlin: 'Main.kt',
    swift: 'main.swift',
    r: 'main.r',
    perl: 'main.pl',
  };
  return map[language] || 'main.txt';
}
