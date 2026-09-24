import { StudyResource, SubjectId } from '../types';

/**
 * Authoritative GATE DA 2028 Study Resources:
 * Verified Textbook PDFs, OpenCourseWare Books, and Top Tutorial Video Series.
 */
export const DEFAULT_SUBJECT_RESOURCES: Record<SubjectId, StudyResource[]> = {
  prob_stat: [
    {
      id: 'res_ps_book_ross',
      title: 'A First Course in Probability (Sheldon Ross)',
      type: 'book_pdf',
      authorOrChannel: 'Sheldon Ross (Pearson)',
      url: 'https://archive.org/details/sheldon-ross-a-first-course-in-probability-8th-ed',
      description: 'Gold standard textbook for GATE DA. Master chapters 1-5 for axioms, Bayes theorem, random variables, and expectation.',
      durationOrPages: '520 pages',
      isStandardReference: true,
    },
    {
      id: 'res_ps_book_wasserman',
      title: 'All of Statistics: A Concise Course in Statistical Inference',
      type: 'book_pdf',
      authorOrChannel: 'Larry Wasserman (Carnegie Mellon Univ)',
      url: 'https://www.stat.cmu.edu/~larry/all-of-statistics/',
      description: 'Concise reference covering estimation, maximum likelihood (MLE), confidence intervals, and hypothesis testing.',
      durationOrPages: '460 pages',
      isStandardReference: true,
    },
    {
      id: 'res_ps_book_harvard110',
      title: 'Introduction to Probability (Harvard Stat 110 Free PDF)',
      type: 'book_pdf',
      authorOrChannel: 'Joseph Blitzstein & Jessica Hwang (Harvard Univ)',
      url: 'https://projects.iq.harvard.edu/stat110/home',
      description: 'Official free textbook for Harvard Stat 110. Renowned for intuitive conditioning and discrete/continuous distribution proofs.',
      durationOrPages: '610 pages',
      isStandardReference: true,
    },
    {
      id: 'res_ps_vid_stat110',
      title: 'Harvard Stat 110: Complete Probability Lecture Series',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Joe Blitzstein (Harvard University)',
      url: 'https://www.youtube.com/playlist?list=PL2SOU6nx8GHA9bws2t3n8_b9t4f89_p5_',
      description: 'Comprehensive 34-lecture video course covering everything from sample space axioms to Markov chains and CLT.',
      durationOrPages: '34 lectures (approx 50m each)',
      isStandardReference: true,
    },
    {
      id: 'res_ps_vid_nptel',
      title: 'NPTEL: Probability & Statistics Course Lectures',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Somesh Kumar (IIT Kharagpur)',
      url: 'https://nptel.ac.in/courses/111105041',
      description: 'Official Indian engineering syllabus matching GATE DA exact question models and rigorous proofs.',
      durationOrPages: '40 lectures',
      isStandardReference: true,
    },
    {
      id: 'res_ps_vid_3b1b_clt',
      title: '3Blue1Brown: The Central Limit Theorem Visualized',
      type: 'video_tutorial',
      authorOrChannel: '3Blue1Brown (Grant Sanderson)',
      url: 'https://www.youtube.com/watch?v=zeJD6dqJ5lo',
      description: 'Intuitive geometric explanation of why sums of random variables converge to Gaussian Bell Curve.',
      durationOrPages: '17 mins',
      isStandardReference: true,
    },
  ],

  linear_algebra: [
    {
      id: 'res_la_book_strang',
      title: 'Introduction to Linear Algebra (5th Edition)',
      type: 'book_pdf',
      authorOrChannel: 'Prof. Gilbert Strang (MIT Wellesley-Cambridge)',
      url: 'https://math.mit.edu/~gs/linearalgebra/',
      description: 'The definitive textbook for GATE DA. Four fundamental subspaces, eigenvalues, eigenvectors, and SVD decomposition.',
      durationOrPages: '600 pages',
      isStandardReference: true,
    },
    {
      id: 'res_la_book_mml',
      title: 'Mathematics for Machine Learning: Linear Algebra (Free Open PDF)',
      type: 'book_pdf',
      authorOrChannel: 'Marc Peter Deisenroth et al. (Cambridge Univ Press)',
      url: 'https://mml-book.github.io/book/mml-book.pdf',
      description: 'Free open-access textbook connecting matrix operations, projections, and matrix decomposition directly to ML algorithms.',
      durationOrPages: '417 pages',
      isStandardReference: true,
    },
    {
      id: 'res_la_vid_3b1b',
      title: '3Blue1Brown: Essence of Linear Algebra (Complete Playlist)',
      type: 'video_tutorial',
      authorOrChannel: '3Blue1Brown (Grant Sanderson)',
      url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab',
      description: 'The world-famous 16-video visual series on vector spaces, linear transforms, determinant geometry, dot/cross products, and eigenvalues.',
      durationOrPages: '16 videos (~15 mins each)',
      isStandardReference: true,
    },
    {
      id: 'res_la_vid_mit1806',
      title: 'MIT 18.06: Linear Algebra Full Course Lectures',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Gilbert Strang (MIT OpenCourseWare)',
      url: 'https://www.youtube.com/playlist?list=PLE7DDD91010BC51F8',
      description: 'Complete 35-lecture recording of Strang teaching at MIT. Essential for intuition on nullspace, column space, and projection matrices.',
      durationOrPages: '35 lectures (~45 mins each)',
      isStandardReference: true,
    },
    {
      id: 'res_la_vid_svd',
      title: 'Steve Brunton: Singular Value Decomposition (SVD) & PCA Masterclass',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Steve Brunton (Univ of Washington)',
      url: 'https://www.youtube.com/watch?v=gXbThCXjZFM',
      description: 'Crystal-clear breakdown of how SVD compresses matrices and how Principal Component Analysis projects data onto maximum variance.',
      durationOrPages: '28 mins',
      isStandardReference: true,
    },
  ],

  calculus_opt: [
    {
      id: 'res_calc_book_boyd',
      title: 'Convex Optimization (Official Free Textbook PDF)',
      type: 'book_pdf',
      authorOrChannel: 'Prof. Stephen Boyd & Lieven Vandenberghe (Stanford Univ)',
      url: 'https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf',
      description: 'Standard master reference for convex sets, convex functions, duality, and Karush-Kuhn-Tucker (KKT) conditions in GATE DA.',
      durationOrPages: '730 pages',
      isStandardReference: true,
    },
    {
      id: 'res_calc_book_thomas',
      title: "Thomas' Calculus: Early Transcendentals",
      type: 'book_pdf',
      authorOrChannel: 'George B. Thomas (Pearson)',
      url: 'https://archive.org/details/thomas-calculus-12th-edition',
      description: 'Foundational calculus for limits, continuity, partial derivatives, directional derivatives, gradient vectors, and Hessian matrices.',
      durationOrPages: '1100 pages',
      isStandardReference: true,
    },
    {
      id: 'res_calc_vid_boyd',
      title: 'Stanford EE364a: Convex Optimization Lectures',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Stephen Boyd (Stanford Online)',
      url: 'https://www.youtube.com/playlist?list=PL3940DD956CDF0622',
      description: 'Original classroom recordings at Stanford on convex analysis, gradient descent, Newton method, and constrained optimization.',
      durationOrPages: '19 lectures (~75m each)',
      isStandardReference: true,
    },
    {
      id: 'res_calc_vid_3b1b',
      title: '3Blue1Brown: Essence of Calculus Playlist',
      type: 'video_tutorial',
      authorOrChannel: '3Blue1Brown',
      url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDMsr9K-rj53DwVRMYO3t5Yr',
      description: 'Visual series explaining limits, derivatives, chain rule, multivariable gradient vectors, and Taylor series approximations.',
      durationOrPages: '12 videos (~18m each)',
      isStandardReference: true,
    },
  ],

  dsa_python: [
    {
      id: 'res_dsa_book_clrs',
      title: 'Introduction to Algorithms (CLRS 3rd/4th Edition)',
      type: 'book_pdf',
      authorOrChannel: 'Cormen, Leiserson, Rivest, Stein (MIT Press)',
      url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/',
      description: 'The bible of algorithms. Crucial for asymptotic notations, divide-and-conquer, sorting algorithms, and graph traversals.',
      durationOrPages: '1312 pages',
      isStandardReference: true,
    },
    {
      id: 'res_dsa_book_pythonds',
      title: 'Problem Solving with Algorithms & Data Structures using Python',
      type: 'book_pdf',
      authorOrChannel: 'Bradley Miller & David Ranum (Runestone Open Text)',
      url: 'https://runestone.academy/ns/books/published/pythonds/index.html',
      description: 'Free interactive textbook implementing stacks, queues, linked lists, binary heaps, trees, and graphs purely in Python.',
      durationOrPages: '420 pages',
      isStandardReference: true,
    },
    {
      id: 'res_dsa_vid_abdul_bari',
      title: 'Abdul Bari: Algorithms & Complexity Analysis Playlist',
      type: 'video_tutorial',
      authorOrChannel: 'Abdul Bari',
      url: 'https://www.youtube.com/playlist?list=PLDN4rrl48XKpZkf03iYFl-O29szjTrs_O',
      description: 'The most popular algorithm lecture series for GATE aspirants. Covers recurrence relations, Master theorem, greedy, DP, and graphs.',
      durationOrPages: '80+ videos (~20m each)',
      isStandardReference: true,
    },
    {
      id: 'res_dsa_vid_mit6006',
      title: 'MIT 6.006: Introduction to Algorithms Full Course',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Erik Demaine & Srini Devadas (MIT OCW)',
      url: 'https://www.youtube.com/playlist?list=PLUl4u3cNGP61Oq3tWYp6V_F-5jb5L2iHb',
      description: 'Rigorous MIT undergraduate curriculum for hashing, heaps, AVL/BST search trees, dynamic programming, and shortest paths.',
      durationOrPages: '24 lectures (~50m each)',
      isStandardReference: true,
    },
  ],

  dbms_warehouse: [
    {
      id: 'res_dbms_book_silberschatz',
      title: 'Database System Concepts (7th Edition)',
      type: 'book_pdf',
      authorOrChannel: 'Silberschatz, Korth, Sudarshan (McGraw Hill)',
      url: 'https://www.db-book.com/',
      description: 'Primary GATE reference for relational algebra, calculus, SQL, normalization (1NF, 2NF, 3NF, BCNF), and B/B+ trees.',
      durationOrPages: '1370 pages',
      isStandardReference: true,
    },
    {
      id: 'res_dbms_book_ch7_pdf',
      title: 'Silberschatz Chapter 7: Relational Database Design & Normalization PDF',
      type: 'book_pdf',
      authorOrChannel: 'Silberschatz et al. (Official Course Slides/Notes)',
      url: 'https://www.db-book.com/db7/slides-dir/PDF-dir/ch7.pdf',
      description: 'Direct PDF chapter slides detailing functional dependency closure, candidate key derivation, and lossless-join decomposition.',
      durationOrPages: '85 slides',
      isStandardReference: true,
    },
    {
      id: 'res_dbms_vid_gate_smashers',
      title: 'Gate Smashers: Complete DBMS & Normalization Playlist',
      type: 'video_tutorial',
      authorOrChannel: 'Gate Smashers (Varun Singla)',
      url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiFAN6I8C9XdK_G6514979Px',
      description: 'Highly acclaimed GATE preparation series with hundreds of solved previous-year questions on SQL, ER models, and normal forms.',
      durationOrPages: '120 videos (~12m each)',
      isStandardReference: true,
    },
    {
      id: 'res_dbms_vid_cmu15445',
      title: 'CMU 15-445/645: Database Systems Lectures',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Andy Pavlo (Carnegie Mellon Univ)',
      url: 'https://www.youtube.com/playlist?list=PLSE8ODhjZXjbohkNBWQs_otTrBTrjyohi',
      description: 'World-renowned university course covering database storage engines, B+ tree indexing internals, and transaction concurrency.',
      durationOrPages: '26 lectures (~75m each)',
      isStandardReference: true,
    },
  ],

  machine_learning: [
    {
      id: 'res_ml_book_islr',
      title: 'An Introduction to Statistical Learning with Python (ISLP Free PDF)',
      type: 'book_pdf',
      authorOrChannel: 'James, Witten, Hastie, Tibshirani, Taylor (Springer)',
      url: 'https://www.statlearning.com/',
      description: 'Official free textbook. The best reference for regression, classification, resampling, regularization (Lasso/Ridge), and trees.',
      durationOrPages: '600 pages',
      isStandardReference: true,
    },
    {
      id: 'res_ml_book_prml',
      title: 'Pattern Recognition and Machine Learning (PRML Free PDF)',
      type: 'book_pdf',
      authorOrChannel: 'Christopher M. Bishop (Microsoft Research / Springer)',
      url: 'https://www.microsoft.com/en-us/research/publication/pattern-recognition-machine-learning/',
      description: 'Authoritative free PDF on Bayesian methods, Gaussian mixture models, EM algorithm, SVMs, and neural networks.',
      durationOrPages: '738 pages',
      isStandardReference: true,
    },
    {
      id: 'res_ml_vid_statquest',
      title: 'StatQuest: Machine Learning Fundamentals Step-by-Step',
      type: 'video_tutorial',
      authorOrChannel: 'StatQuest with Josh Starmer',
      url: 'https://www.youtube.com/playlist?list=PLblh5JKOoLUICTaGLRoHQDuF_7q2GfuJF',
      description: 'Crystal-clear visual explanations of Linear Regression, Logistic Regression, Decision Trees, Random Forests, SVM, and Cross Validation.',
      durationOrPages: '45+ videos (~15m each)',
      isStandardReference: true,
    },
    {
      id: 'res_ml_vid_cs229',
      title: 'Stanford CS229: Machine Learning by Andrew Ng',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Andrew Ng (Stanford University)',
      url: 'https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU',
      description: 'The legendary Stanford machine learning course. Master mathematical derivations of cost functions, gradient updates, and Naive Bayes.',
      durationOrPages: '20 lectures (~75m each)',
      isStandardReference: true,
    },
    {
      id: 'res_ml_vid_3b1b_nn',
      title: '3Blue1Brown: Neural Networks & Backpropagation Visual Series',
      type: 'video_tutorial',
      authorOrChannel: '3Blue1Brown',
      url: 'https://www.youtube.com/playlist?list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi',
      description: 'Groundbreaking 4-part visual journey through multi-layer perceptrons, matrix multiplication activations, cost functions, and gradient descent.',
      durationOrPages: '4 videos (~18m each)',
      isStandardReference: true,
    },
  ],

  artificial_intel: [
    {
      id: 'res_ai_book_aima',
      title: 'Artificial Intelligence: A Modern Approach (AIMA 4th Edition)',
      type: 'book_pdf',
      authorOrChannel: 'Stuart Russell & Peter Norvig (Pearson)',
      url: 'https://aima.cs.berkeley.edu/',
      description: 'The universal AI textbook. Essential for Informed & Uninformed Search, A* heuristic admissibility, Minimax, and Propositional Logic.',
      durationOrPages: '1150 pages',
      isStandardReference: true,
    },
    {
      id: 'res_ai_book_aima_search_pdf',
      title: 'Russell & Norvig Chapter 3: Solving Problems by Searching (Official PDF Slides)',
      type: 'book_pdf',
      authorOrChannel: 'Russell & Norvig (UC Berkeley)',
      url: 'https://aima.cs.berkeley.edu/slides-pdf/chapter03.pdf',
      description: 'Concise Berkeley slides detailing BFS, DFS, Uniform Cost Search, Greedy Best-First, and A* algorithm completeness and optimality.',
      durationOrPages: '65 slides',
      isStandardReference: true,
    },
    {
      id: 'res_ai_vid_cs188',
      title: 'UC Berkeley CS188: Introduction to Artificial Intelligence',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Dan Klein & Pieter Abbeel (UC Berkeley)',
      url: 'https://www.youtube.com/playlist?list=PLsOUugYNCpTfP1G6l_v_GgJ03WlI2qWj9',
      description: 'Top-tier university lectures on state space search, heuristics consistency, game trees, alpha-beta cutoffs, and constraint satisfaction.',
      durationOrPages: '25 lectures (~75m each)',
      isStandardReference: true,
    },
    {
      id: 'res_ai_vid_computerphile_astar',
      title: 'Computerphile: A* (A Star) Search Algorithm Explained',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Mike Pound (Computerphile)',
      url: 'https://www.youtube.com/watch?v=ySN5Wnu88nE',
      description: 'Quick intuitive breakdown of g(n) + h(n) heuristic search, priority queues, and path cost optimization.',
      durationOrPages: '12 mins',
      isStandardReference: true,
    },
    {
      id: 'res_ai_vid_nptel',
      title: 'NPTEL: AI Search Methods for Problem Solving',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Deepak Khemani (IIT Madras)',
      url: 'https://nptel.ac.in/courses/106106126',
      description: 'Rigorously tailored for Indian entrance examinations and GATE conceptual problem solving.',
      durationOrPages: '42 lectures',
      isStandardReference: true,
    },
  ],

  general_aptitude: [
    {
      id: 'res_ga_book_sharma',
      title: 'Quantitative Aptitude for Competitive Examinations',
      type: 'book_pdf',
      authorOrChannel: 'Arun Sharma (McGraw Hill)',
      url: 'https://archive.org/details/how-to-prepare-for-quantitative-aptitude-for-the-cat-by-arun-sharma-z-lib.org',
      description: 'Complete coverage of arithmetic, percentages, ratios, time-speed-distance, permutations, and algebra for GATE Aptitude.',
      durationOrPages: '800 pages',
      isStandardReference: true,
    },
    {
      id: 'res_ga_book_word_power',
      title: 'Word Power Made Easy: Vocabulary & Verbal Reasoning',
      type: 'book_pdf',
      authorOrChannel: 'Norman Lewis (Anchor Books)',
      url: 'https://archive.org/details/word-power-made-easy-norman-lewis',
      description: 'Etymology, root words, analogies, and sentence completion techniques to score full marks in the 15-mark General Aptitude section.',
      durationOrPages: '560 pages',
      isStandardReference: true,
    },
    {
      id: 'res_ga_vid_gate_smashers',
      title: 'Gate Smashers: Complete General Aptitude Playlist',
      type: 'video_tutorial',
      authorOrChannel: 'Gate Smashers',
      url: 'https://www.youtube.com/playlist?list=PLxCzCOWd7aiESb1_pvyu_y9m_yC-G39e8',
      description: 'Quick tricks and shortcut formulas for numerical ability, logical deduction, and spatial reasoning.',
      durationOrPages: '60+ videos (~10m each)',
      isStandardReference: true,
    },
  ],

  mock_pyq: [
    {
      id: 'res_mock_pyq_da2024',
      title: 'Official GATE DA 2024 Question Paper with Solution Key PDF',
      type: 'book_pdf',
      authorOrChannel: 'IISc Bangalore (Official GATE Organizers)',
      url: 'https://gate2024.iisc.ac.in/',
      description: 'The historic inaugural GATE Data Science & AI question paper. Solved with official IISc answer keys.',
      durationOrPages: '65 questions (100 marks)',
      isStandardReference: true,
    },
  ],
};

/**
 * Topic-Specific Resources mapped by topic ID.
 */
export const DEFAULT_TOPIC_RESOURCES: Record<string, StudyResource[]> = {
  ps_prob_axioms: [
    {
      id: 'top_ps_bayes_3b1b',
      title: '3Blue1Brown: The Quick Visual Proof of Bayes Theorem',
      type: 'video_tutorial',
      authorOrChannel: '3Blue1Brown',
      url: 'https://www.youtube.com/watch?v=HZGCoVF3YvM',
      description: 'Geometric perspective on conditional probability, likelihood ratios, and prior vs posterior distributions.',
      subtopicTitle: 'Bayes Theorem',
      durationOrPages: '15 mins',
      isStandardReference: true,
    },
    {
      id: 'top_ps_ross_ch23',
      title: 'Sheldon Ross: Chapter 2 & 3 - Probability Axioms & Conditional Events PDF',
      type: 'book_pdf',
      authorOrChannel: 'Sheldon Ross',
      url: 'https://archive.org/details/sheldon-ross-a-first-course-in-probability-8th-ed',
      description: 'Textbook chapter covering sample spaces, mutually exclusive events, independence test, and total probability law.',
      subtopicTitle: 'Law of Total Probability',
      durationOrPages: 'Chapter 2-3 (pp. 24-88)',
      isStandardReference: true,
    },
  ],

  ps_random_vars: [
    {
      id: 'top_ps_statquest_exp',
      title: 'StatQuest: Expected Value, Variance & Covariance Explained Simply',
      type: 'video_tutorial',
      authorOrChannel: 'StatQuest with Josh Starmer',
      url: 'https://www.youtube.com/watch?v=7xZ_kKkC_2g',
      description: 'Clear intuition on discrete PMF expectation, continuous PDF integration, and correlation coefficients.',
      subtopicTitle: 'Expectation, Variance, and Moments',
      durationOrPages: '16 mins',
      isStandardReference: true,
    },
    {
      id: 'top_ps_harvard_rv',
      title: 'Harvard Stat 110: Lecture 6 - Random Variables and their Distributions',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Joe Blitzstein (Harvard)',
      url: 'https://www.youtube.com/watch?v=1uW3qWbLSOo',
      description: 'Foundational video on mapping outcomes to real numbers and Cumulative Distribution Function (CDF) properties.',
      subtopicTitle: 'Cumulative Distribution Function (CDF)',
      durationOrPages: '48 mins',
      isStandardReference: true,
    },
  ],

  la_matrices: [
    {
      id: 'top_la_3b1b_vectors',
      title: '3Blue1Brown: Vectors & Linear Transformations Visualized',
      type: 'video_tutorial',
      authorOrChannel: '3Blue1Brown',
      url: 'https://www.youtube.com/watch?v=k7RM-ot2NWY',
      description: 'Visual understanding of basis vectors, span, linear independence, and coordinate systems.',
      subtopicTitle: 'Vector space, subspaces, and linear combinations',
      durationOrPages: '11 mins',
      isStandardReference: true,
    },
    {
      id: 'top_la_strang_ch3',
      title: 'Gilbert Strang: Chapter 3 - Vector Spaces and Subspaces PDF',
      type: 'book_pdf',
      authorOrChannel: 'Gilbert Strang (MIT)',
      url: 'https://math.mit.edu/~gs/linearalgebra/ila0301.pdf',
      description: 'Official chapter PDF detailing nullspace, column space, basis, dimension, and rank-nullity theorem.',
      subtopicTitle: 'Rank-nullity theorem & matrix rank',
      durationOrPages: '52 pages',
      isStandardReference: true,
    },
  ],

  la_eigen: [
    {
      id: 'top_la_3b1b_eigen',
      title: '3Blue1Brown: Eigenvectors and Eigenvalues Visually',
      type: 'video_tutorial',
      authorOrChannel: '3Blue1Brown',
      url: 'https://www.youtube.com/watch?v=PFDu9oVAE-g',
      description: 'Why some vectors do not rotate during a linear transformation, only scale by lambda.',
      subtopicTitle: 'Characteristic equation and spectrum',
      durationOrPages: '17 mins',
      isStandardReference: true,
    },
    {
      id: 'top_la_mit_lec21',
      title: 'MIT 18.06: Lecture 21 - Eigenvalues and Eigenvectors by Gilbert Strang',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Gilbert Strang',
      url: 'https://www.youtube.com/watch?v=lXNXrLcoerU',
      description: 'Solving det(A - lambda*I) = 0, diagonalizing matrices with S^(-1)*A*S, and symmetric matrix spectral theorem.',
      subtopicTitle: 'Diagonalization and matrix powers',
      durationOrPages: '50 mins',
      isStandardReference: true,
    },
  ],

  calc_optimization: [
    {
      id: 'top_calc_boyd_ch5',
      title: 'Boyd & Vandenberghe: Chapter 5 - Duality & KKT Optimality Conditions PDF',
      type: 'book_pdf',
      authorOrChannel: 'Stephen Boyd (Stanford)',
      url: 'https://web.stanford.edu/~boyd/cvxbook/bv_cvxbook.pdf',
      description: 'Lagrangian dual problem, weak & strong duality, Slater condition, and Karush-Kuhn-Tucker (KKT) equations.',
      subtopicTitle: 'Lagrange multipliers and KKT conditions',
      durationOrPages: 'Chapter 5 (pp. 215-288)',
      isStandardReference: true,
    },
    {
      id: 'top_calc_mit_grad',
      title: '3Blue1Brown: Visualizing the Gradient & Directional Derivatives',
      type: 'video_tutorial',
      authorOrChannel: '3Blue1Brown',
      url: 'https://www.youtube.com/watch?v=GkB4vW16QHI',
      description: 'Step-by-step vector geometry showing why the gradient points in the direction of steepest ascent.',
      subtopicTitle: 'Gradient Descent (Batch, Mini-batch, Stochastic)',
      durationOrPages: '16 mins',
      isStandardReference: true,
    },
  ],

  dsa_trees_graphs: [
    {
      id: 'top_dsa_williamfiset_graphs',
      title: 'WilliamFiset: Graph Algorithms (BFS, DFS, Dijkstra & Topo Sort)',
      type: 'video_tutorial',
      authorOrChannel: 'WilliamFiset (Google Engineer)',
      url: 'https://www.youtube.com/playlist?list=PLDV1Zeh2NRsDGO4--qE8yH72HFL1Km93P',
      description: 'Animated step-by-step trace of graph traversals, cycle detection, and shortest path algorithms.',
      subtopicTitle: 'Breadth-First Search (BFS) & Depth-First Search (DFS)',
      durationOrPages: 'Playlist (15m each)',
      isStandardReference: true,
    },
    {
      id: 'top_dsa_clrs_graphs_pdf',
      title: 'CLRS Chapter 22: Elementary Graph Algorithms Notes PDF',
      type: 'book_pdf',
      authorOrChannel: 'Cormen et al. (MIT Press)',
      url: 'https://mitpress.mit.edu/9780262046305/introduction-to-algorithms/',
      description: 'Adjacency list vs matrix representations, runtime analysis O(V + E), topological sorting DAGs.',
      subtopicTitle: 'Topological sort and DAG applications',
      durationOrPages: 'Chapter 22',
      isStandardReference: true,
    },
  ],

  dbms_normalization: [
    {
      id: 'top_dbms_varun_norm',
      title: 'Gate Smashers: Complete Normalization (1NF, 2NF, 3NF, BCNF) with Solved PYQs',
      type: 'video_tutorial',
      authorOrChannel: 'Gate Smashers (Varun Singla)',
      url: 'https://www.youtube.com/watch?v=5hshtrB6t80',
      description: 'Step-by-step method to identify candidate keys, compute attribute closure X+, and determine highest normal form.',
      subtopicTitle: 'First, Second, Third Normal Form (1NF, 2NF, 3NF)',
      durationOrPages: '22 mins',
      isStandardReference: true,
    },
    {
      id: 'top_dbms_silberschatz_ch7',
      title: 'Silberschatz Database Design: Chapter 7 Normalization Slides PDF',
      type: 'book_pdf',
      authorOrChannel: 'Silberschatz et al.',
      url: 'https://www.db-book.com/db7/slides-dir/PDF-dir/ch7.pdf',
      description: 'Official slide set showing functional dependencies, Boyce-Codd Normal Form, and dependency preservation test.',
      subtopicTitle: 'Boyce-Codd Normal Form (BCNF) & Decomposition',
      durationOrPages: '85 slides',
      isStandardReference: true,
    },
  ],

  ml_supervised: [
    {
      id: 'top_ml_statquest_logistic',
      title: 'StatQuest: Logistic Regression & Odds Ratios Clearly Explained',
      type: 'video_tutorial',
      authorOrChannel: 'StatQuest with Josh Starmer',
      url: 'https://www.youtube.com/watch?v=yIYKR4gXd5U',
      description: 'Intuition behind the Sigmoid function, log-odds transformation, and maximum likelihood estimation of weights.',
      subtopicTitle: 'Logistic Regression and cross-entropy loss',
      durationOrPages: '12 mins',
      isStandardReference: true,
    },
    {
      id: 'top_ml_statquest_svm',
      title: 'StatQuest: Support Vector Machines (SVM) & Kernel Trick Explained',
      type: 'video_tutorial',
      authorOrChannel: 'StatQuest with Josh Starmer',
      url: 'https://www.youtube.com/watch?v=efR1C6CvhmE',
      description: 'Maximum margin hyperplanes, soft margin slack variables C, and RBF kernel projection.',
      subtopicTitle: 'Support Vector Machines (SVM) and Kernels',
      durationOrPages: '15 mins',
      isStandardReference: true,
    },
    {
      id: 'top_ml_islp_ch4_pdf',
      title: 'ISLP Chapter 4: Classification Algorithms (Logistic Regression, LDA, QDA) PDF',
      type: 'book_pdf',
      authorOrChannel: 'Hastie, Tibshirani et al. (Stanford)',
      url: 'https://www.statlearning.com/',
      description: 'Official chapter PDF with mathematical proofs and Python code examples.',
      subtopicTitle: 'Linear Discriminant Analysis (LDA)',
      durationOrPages: 'Chapter 4 (pp. 129-196)',
      isStandardReference: true,
    },
  ],

  ai_search: [
    {
      id: 'top_ai_computerphile_astar',
      title: 'Computerphile: A* Pathfinding and Admissible Heuristics',
      type: 'video_tutorial',
      authorOrChannel: 'Prof. Mike Pound (Computerphile)',
      url: 'https://www.youtube.com/watch?v=ySN5Wnu88nE',
      description: 'Visual demonstration of f(n) = g(n) + h(n), priority queue expansion, and why h(n) <= h*(n) guarantees optimal path.',
      subtopicTitle: 'A* search and heuristic admissibility/consistency',
      durationOrPages: '12 mins',
      isStandardReference: true,
    },
    {
      id: 'top_ai_aima_ch3_pdf',
      title: 'Russell & Norvig AIMA: Chapter 3 Search Algorithms PDF Notes',
      type: 'book_pdf',
      authorOrChannel: 'Stuart Russell & Peter Norvig (UC Berkeley)',
      url: 'https://aima.cs.berkeley.edu/slides-pdf/chapter03.pdf',
      description: 'Standard textbook slides on uninformed search (BFS, DFS, Uniform Cost) and informed search (Greedy, A*).',
      subtopicTitle: 'Uninformed search: BFS, DFS, Uniform Cost Search',
      durationOrPages: '65 slides',
      isStandardReference: true,
    },
  ],
};

const USER_CUSTOM_RESOURCES_KEY = 'gateda_2028_custom_resources_';

/**
 * Loads custom resources added by a specific user from localStorage.
 */
export function getSavedCustomResources(userId: string): Record<string, StudyResource[]> {
  try {
    const raw = localStorage.getItem(`${USER_CUSTOM_RESOURCES_KEY}${userId}`);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Saves a user-added custom resource (book PDF or video link) to persistent storage.
 */
export function saveCustomResource(
  userId: string,
  targetId: string, // subjectId or topicId
  resource: StudyResource
): Record<string, StudyResource[]> {
  try {
    const existing = getSavedCustomResources(userId);
    const list = existing[targetId] || [];
    existing[targetId] = [...list, resource];
    localStorage.setItem(`${USER_CUSTOM_RESOURCES_KEY}${userId}`, JSON.stringify(existing));
    return existing;
  } catch {
    return {};
  }
}

/**
 * Deletes a user custom resource.
 */
export function deleteCustomResource(
  userId: string,
  targetId: string,
  resourceId: string
): Record<string, StudyResource[]> {
  try {
    const existing = getSavedCustomResources(userId);
    if (existing[targetId]) {
      existing[targetId] = existing[targetId].filter((r) => r.id !== resourceId);
      localStorage.setItem(`${USER_CUSTOM_RESOURCES_KEY}${userId}`, JSON.stringify(existing));
    }
    return existing;
  } catch {
    return {};
  }
}
