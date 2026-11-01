const handler = require('./api/index').default;

function mockReqRes(options) {
  const req = {
    method: options.method || 'GET',
    url: options.url || '/api/buzz',
    headers: {
      'content-type': 'application/json',
      authorization: options.token ? `Bearer ${options.token}` : 'Bearer token_usr_test',
      ...options.headers,
    },
    query: options.query || {},
    on: (evt, cb) => {
      if (evt === 'data' && options.body) {
        cb(Buffer.from(JSON.stringify(options.body)));
      }
      if (evt === 'end') {
        cb();
      }
    },
  };

  let statusCode = 200;
  let headers = {};
  let body = '';

  const res = {
    statusCode: 200,
    setHeader: (k, v) => {
      headers[k] = v;
    },
    getHeader: (k) => headers[k],
    end: (chunk) => {
      if (chunk) body += chunk;
      if (res.resolvePromise) {
        let parsed = body;
        try {
          parsed = JSON.parse(body);
        } catch {}
        res.resolvePromise({ status: res.statusCode, headers, data: parsed });
      }
    },
  };

  const promise = new Promise((resolve) => {
    res.resolvePromise = resolve;
  });

  return { req, res, promise };
}

async function runTest(name, fn) {
  try {
    process.stdout.write(`• ${name}... `);
    await fn();
    console.log('PASSED ✅');
  } catch (err) {
    console.log('FAILED ❌');
    console.error(err);
    process.exit(1);
  }
}

async function main() {
  console.log('====================================================');
  console.log('🚀 ADDA BUZZ FULL COMPREHENSIVE AUTOMATION TEST SUITE');
  console.log('====================================================\n');

  let testPostId = '';
  let testPollPostId = '';
  let testCommentId = '';

  // 1. Fetch Buzz Feed
  await runTest('1. GET /api/buzz (Fetch Initial Circle Feed)', async () => {
    const { req, res, promise } = mockReqRes({
      method: 'GET',
      url: '/api/buzz?category=ALL&filter=all',
    });
    handler(req, res);
    const result = await promise;
    if (result.status !== 200 || !Array.isArray(result.data)) {
      throw new Error(`Feed fetch failed: status ${result.status}`);
    }
    if (result.data.length === 0) {
      throw new Error('Expected seed buzz posts in feed');
    }
  });

  // 2. Create Buzz Post (Spill the Tea)
  await runTest('2. POST /api/buzz (Create Spill the Tea Post)', async () => {
    const { req, res, promise } = mockReqRes({
      method: 'POST',
      url: '/api/buzz',
      body: {
        addaId: 'default',
        category: 'SPILL_THE_TEA',
        credibility: 'PERSONAL_EXPERIENCE',
        expiry: 'EXP_24H',
        title: 'Late Night Library Incident',
        content: 'Someone left an entire pizza box on the 3rd floor reading table with a note saying "eat at your own risk".',
      },
    });
    handler(req, res);
    const result = await promise;
    if (result.status !== 201 || !result.data?.id) {
      throw new Error(`Post creation failed: ${JSON.stringify(result.data)}`);
    }
    testPostId = result.data.id;
    if (result.data.category !== 'SPILL_THE_TEA' || !result.data.expiresAt) {
      throw new Error('Category or expiry mismatch in created post');
    }
  });

  // 3. Create Anonymous Confession Post
  await runTest('3. POST /api/buzz (Create Anonymous Confession Post)', async () => {
    const { req, res, promise } = mockReqRes({
      method: 'POST',
      url: '/api/buzz',
      body: {
        addaId: 'default',
        category: 'CONFESSION',
        credibility: 'PERSONAL_EXPERIENCE',
        isAnonymous: true,
        title: 'Secret Confession',
        content: 'I borrowed my roommate\'s headphones and pretended I lost them so I could keep them for an extra week.',
      },
    });
    handler(req, res);
    const result = await promise;
    if (result.status !== 201 || !result.data?.id) {
      throw new Error('Anonymous post creation failed');
    }
    if (!result.data.isAnonymous || result.data.authorName !== 'Anonymous Member') {
      throw new Error('Anonymous masking failed');
    }
  });

  // 4. Create Poll & Hot Take Post
  await runTest('4. POST /api/buzz (Create Poll & Hot Take with Options)', async () => {
    const { req, res, promise } = mockReqRes({
      method: 'POST',
      url: '/api/buzz',
      body: {
        addaId: 'default',
        category: 'POLL_HOT_TAKE',
        credibility: 'UNVERIFIED_CLAIM',
        title: 'Best Chai in Town?',
        content: 'Which one do you swear by on a rainy evening?',
        pollOptions: ['Chai Point Ginger', 'Corner Tea Stall Elaichi', 'Tapri Special Cut', 'Kulhad Chai'],
      },
    });
    handler(req, res);
    const result = await promise;
    if (result.status !== 201 || !result.data?.id) {
      throw new Error('Poll creation failed');
    }
    testPollPostId = result.data.id;
    if (!Array.isArray(result.data.pollOptions) || result.data.pollOptions.length !== 4) {
      throw new Error('Poll options count mismatch');
    }
  });

  // 5. Anti-Doxxing & Contact Info Safety Shield
  await runTest('5. POST /api/buzz (Safety Guard: Block Phone Number Doxxing)', async () => {
    const { req, res, promise } = mockReqRes({
      method: 'POST',
      url: '/api/buzz',
      body: {
        addaId: 'default',
        content: 'Call this person immediately 9845123456 they leaked the questions',
      },
    });
    handler(req, res);
    const result = await promise;
    if (result.status !== 400 || !result.data?.message?.includes('strictly prohibited')) {
      throw new Error('Expected anti-doxxing guard to block phone number');
    }
  });

  // 6. Toggle Reactions (7 Emojis: 😂, 👀, 🍿, ☕, 🔥, 💀, ❤️)
  await runTest('6. POST /api/buzz/:id/react (Toggle ☕ and 🔥 Reactions)', async () => {
    // Add reaction ☕
    const { req, res, promise } = mockReqRes({
      method: 'POST',
      url: `/api/buzz/${testPostId}/react`,
      body: { emoji: '☕' },
    });
    handler(req, res);
    const result = await promise;
    if (result.status !== 200 || result.data.reactions['☕'] !== 1) {
      throw new Error('Reaction add failed');
    }

    // Add reaction 🔥
    const { req: r2, res: s2, promise: p2 } = mockReqRes({
      method: 'POST',
      url: `/api/buzz/${testPostId}/react`,
      body: { emoji: '🔥' },
    });
    handler(r2, s2);
    const res2 = await p2;
    if (res2.status !== 200 || res2.data.reactions['🔥'] !== 1) {
      throw new Error('Second reaction add failed');
    }
  });

  // 7. Interactive Poll Voting
  await runTest('7. POST /api/buzz/:id/vote (Cast Interactive Vote on Poll)', async () => {
    // Vote on option 0
    const optId = `opt_${testPollPostId}`;
    const { req, res, promise } = mockReqRes({
      method: 'POST',
      url: `/api/buzz/${testPollPostId}/vote`,
      body: { optionId: optId },
    });
    handler(req, res);
    const result = await promise;
    if (result.status !== 200 || !Array.isArray(result.data.pollOptions)) {
      throw new Error('Poll voting failed');
    }
  });

  // 8. Threaded Comments & @Mentions
  await runTest('8. POST /api/buzz/:id/comments (Add Comment with @Mention)', async () => {
    const { req, res, promise } = mockReqRes({
      method: 'POST',
      url: `/api/buzz/${testPostId}/comments`,
      body: {
        content: 'No way @rohitk did this actually happen? 💀',
      },
    });
    handler(req, res);
    const result = await promise;
    if (result.status !== 201 || !result.data?.id) {
      throw new Error('Add comment failed');
    }
    testCommentId = result.data.id;
    if (!result.data.mentions || !result.data.mentions.includes('rohitk')) {
      throw new Error('Mention parsing failed');
    }

    // Fetch comments
    const { req: r2, res: s2, promise: p2 } = mockReqRes({
      method: 'GET',
      url: `/api/buzz/${testPostId}/comments`,
    });
    handler(r2, s2);
    const listRes = await p2;
    if (listRes.status !== 200 || listRes.data.length === 0) {
      throw new Error('Fetch comments failed');
    }
  });

  // 9. Bookmark / Save Post
  await runTest('9. POST /api/buzz/:id/bookmark (Save Post to Bookmarks)', async () => {
    const { req, res, promise } = mockReqRes({
      method: 'POST',
      url: `/api/buzz/${testPostId}/bookmark`,
    });
    handler(req, res);
    const result = await promise;
    if (result.status !== 200 || !result.data.isBookmarked) {
      throw new Error('Bookmark toggle failed');
    }
  });

  // 10. Trending & Saved Filter Feeds
  await runTest('10. GET /api/buzz?filter=trending & filter=saved', async () => {
    // Trending
    const { req: r1, res: s1, promise: p1 } = mockReqRes({
      method: 'GET',
      url: '/api/buzz?filter=trending',
    });
    handler(r1, s1);
    const res1 = await p1;
    if (res1.status !== 200 || !Array.isArray(res1.data)) {
      throw new Error('Trending filter failed');
    }

    // Saved
    const { req: r2, res: s2, promise: p2 } = mockReqRes({
      method: 'GET',
      url: '/api/buzz?filter=saved',
    });
    handler(r2, s2);
    const res2 = await p2;
    if (res2.status !== 200 || !res2.data.some((p) => p.id === testPostId)) {
      throw new Error('Saved filter failed to return bookmarked post');
    }
  });

  // 11. Report Inappropriate Content
  await runTest('11. POST /api/buzz/:id/report (Moderation Report)', async () => {
    const { req, res, promise } = mockReqRes({
      method: 'POST',
      url: `/api/buzz/${testPostId}/report`,
      body: {
        reason: 'Harassment / Bullying',
        details: 'Testing abuse reporting pipeline',
      },
    });
    handler(req, res);
    const result = await promise;
    if (result.status !== 200 || !result.data.success) {
      throw new Error('Report submission failed');
    }
  });

  // 12. Delete Post
  await runTest('12. DELETE /api/buzz/:id (Author Delete Post)', async () => {
    const { req, res, promise } = mockReqRes({
      method: 'DELETE',
      url: `/api/buzz/${testPostId}`,
    });
    handler(req, res);
    const result = await promise;
    if (result.status !== 200 || !result.data.success) {
      throw new Error('Post deletion failed');
    }
  });

  console.log('\n====================================================');
  console.log('🎉 ALL 12 ADDA BUZZ AUTOMATION TESTS PASSED 100%!');
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
