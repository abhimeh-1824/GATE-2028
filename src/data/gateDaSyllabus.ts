import { Subject, Task, MockTest, Milestone, CalendarEvent, UserSettings } from '../types';

export const INITIAL_SETTINGS: UserSettings = {
  targetAir: 1,
  targetYear: 2028,
  examDate: '2028-02-13', // GATE 2028 target exam date
  dailyGoalHours: 4.5,
  weeklyGoalHours: 28,
  streakCount: 14,
  userName: 'Rohit Sharma',
  targetCollege: 'IISc Bangalore (M.Tech AI) / IIT Bombay (CSE-AI)',
};

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'prob_stat',
    name: 'Probability and Statistics',
    shortCode: 'P&S',
    weightageMarks: '16-18 Marks',
    approxQuestions: 10,
    color: '#4338ca', // Indigo
    bgLight: '#eef2ff',
    borderColor: '#c7d2fe',
    description: 'Foundational bedrock of Data Science & AI. Covers counting, conditional probability, Bayes theorem, distributions, CLT, and hypothesis testing.',
    recommendedBooks: ['Sheldon Ross - First Course in Probability', 'Larry Wasserman - All of Statistics'],
    topics: [
      {
        id: 'ps_prob_axioms',
        subjectId: 'prob_stat',
        title: 'Probability Axioms & Conditional Probability',
        subtopics: ['Sample space and events', 'Mutually exclusive vs Independent events', 'Marginal and conditional probability', 'Law of Total Probability', 'Bayes Theorem'],
        weightageTier: 'Critical (High)',
        status: 'completed',
        confidenceScore: 5,
        lastRevised: '2026-09-20',
        nextRevisionDue: '2026-09-28',
        pyqsTotal: 34,
        pyqsSolved: 34,
        pyqAccuracy: 91,
        formulas: [
          {
            id: 'bayes_rule',
            title: 'Bayes Theorem',
            latex: 'P(A|B) = \\frac{P(B|A) \\cdot P(A)}{P(B)} = \\frac{P(B|A) P(A)}{\\sum_{i} P(B|A_i) P(A_i)}',
            plainText: 'P(A|B) = [P(B|A) * P(A)] / P(B)',
            explanation: 'Updates the prior probability P(A) with evidence P(B) to compute posterior P(A|B).',
            tag: 'Core'
          },
          {
            id: 'indep_cond',
            title: 'Independence Condition',
            latex: 'P(A \\cap B) = P(A) \\cdot P(B) \\iff P(A|B) = P(A)',
            plainText: 'P(A ∩ B) = P(A) * P(B)',
            explanation: 'Two events are statistically independent if occurrence of one gives zero information about the other.',
            tag: 'Axiom'
          }
        ],
        commonTraps: [
          'Mutually exclusive events with non-zero probabilities can NEVER be independent!',
          'Be vigilant about P(B|A) vs P(A|B) false positive fallacy in medical testing questions.'
        ]
      },
      {
        id: 'ps_random_vars',
        subjectId: 'prob_stat',
        title: 'Random Variables & Expectation',
        subtopics: ['Discrete & continuous random variables', 'PMF and PDF properties', 'Cumulative Distribution Function (CDF)', 'Expectation, Variance, and Moments', 'Covariance and Correlation coefficient'],
        weightageTier: 'Critical (High)',
        status: 'completed',
        confidenceScore: 4,
        lastRevised: '2026-09-18',
        nextRevisionDue: '2026-09-26',
        pyqsTotal: 42,
        pyqsSolved: 38,
        pyqAccuracy: 86,
        formulas: [
          {
            id: 'variance_formula',
            title: 'Variance & Linearity of Expectation',
            latex: 'Var(X) = E[X^2] - (E[X])^2, \\quad Var(aX + bY) = a^2Var(X) + b^2Var(Y) + 2ab\\,Cov(X,Y)',
            plainText: 'Var(X) = E[X^2] - (E[X])^2',
            explanation: 'Linearity of expectation always holds regardless of independence; variance linearity requires independence (Cov = 0).',
            tag: 'Moments'
          },
          {
            id: 'correlation_formula',
            title: 'Pearson Correlation Coefficient',
            latex: '\\rho_{X,Y} = \\frac{Cov(X,Y)}{\\sigma_X \\sigma_Y} \\in [-1, 1]',
            plainText: 'ρ(X,Y) = Cov(X,Y) / (σ_X * σ_Y)',
            explanation: 'Measures only linear relationship. Zero correlation does not guarantee independence.',
            tag: 'Association'
          }
        ],
        commonTraps: [
          'Cov(X,Y) = 0 does NOT guarantee independence unless X and Y are jointly Gaussian!',
          'CDF is always non-decreasing and right-continuous, with limit 0 at -∞ and 1 at +∞.'
        ]
      },
      {
        id: 'ps_distributions',
        subjectId: 'prob_stat',
        title: 'Parametric Probability Distributions',
        subtopics: ['Bernoulli & Binomial', 'Poisson distribution & Poisson approximation', 'Uniform (discrete & continuous)', 'Exponential distribution (Memoryless property)', 'Normal / Standard Normal distribution (Z-scores)'],
        weightageTier: 'Critical (High)',
        status: 'in_progress',
        confidenceScore: 4,
        lastRevised: '2026-09-23',
        nextRevisionDue: '2026-09-30',
        pyqsTotal: 50,
        pyqsSolved: 35,
        pyqAccuracy: 88,
        formulas: [
          {
            id: 'poisson_pmf',
            title: 'Poisson Distribution PMF',
            latex: 'P(X = k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}, \\quad E[X] = Var(X) = \\lambda',
            plainText: 'P(X = k) = (λ^k * e^-λ) / k!',
            explanation: 'Crucial property: Mean equals Variance = λ.',
            tag: 'Discrete'
          },
          {
            id: 'normal_pdf',
            title: 'Gaussian / Normal PDF',
            latex: 'f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} \\exp\\left(-\\frac{(x - \\mu)^2}{2\\sigma^2}\\right)',
            plainText: 'f(x) = (1 / (σ√(2π))) * exp(-(x-μ)^2 / (2σ^2))',
            explanation: 'Bell-shaped symmetric distribution governed completely by mean μ and variance σ².',
            tag: 'Continuous'
          }
        ],
        commonTraps: [
          'Exponential distribution has memoryless property P(X > s + t | X > s) = P(X > t); geometric is the only discrete analogue.',
          'Always normalize to Standard Normal Z = (X - μ) / σ before consulting standard tables.'
        ]
      },
      {
        id: 'ps_inference_tests',
        subjectId: 'prob_stat',
        title: 'Sampling, Central Limit Theorem & Hypothesis Testing',
        subtopics: ['Central Limit Theorem (CLT)', 'Confidence intervals for mean', 'Z-test vs Student t-test', 'Chi-squared distribution and test', 'Type I and Type II errors, p-values'],
        weightageTier: 'Critical (High)',
        status: 'revision_due',
        confidenceScore: 3,
        lastRevised: '2026-09-12',
        nextRevisionDue: '2026-09-24',
        pyqsTotal: 36,
        pyqsSolved: 24,
        pyqAccuracy: 75,
        formulas: [
          {
            id: 'clt_formula',
            title: 'Central Limit Theorem (CLT)',
            latex: '\\bar{X}_n \\xrightarrow{d} \\mathcal{N}\\left(\\mu, \\frac{\\sigma^2}{n}\\right) \\implies Z = \\frac{\\bar{X}_n - \\mu}{\\sigma / \\sqrt{n}} \\sim \\mathcal{N}(0, 1)',
            plainText: 'Z = (X_bar - μ) / (σ / √n) ~ N(0,1)',
            explanation: 'Sample mean tends toward normal distribution as n -> ∞, regardless of population distribution shape.',
            tag: 'Asymptotic'
          },
          {
            id: 't_statistic',
            title: 'Student t-Statistic (Unknown σ)',
            latex: 't = \\frac{\\bar{X} - \\mu_0}{s / \\sqrt{n}}, \\quad df = n - 1',
            plainText: 't = (X_bar - μ0) / (s / √n) with df = n - 1',
            explanation: 'Used when population variance σ is unknown and sample standard deviation s is substituted.',
            tag: 'Inference'
          }
        ],
        commonTraps: [
          'Type I error α is rejecting H0 when true; Type II error β is failing to reject H0 when false. Power = 1 - β.',
          't-test requires normal population assumption for small sample size (n < 30).'
        ]
      }
    ]
  },
  {
    id: 'linear_algebra',
    name: 'Linear Algebra',
    shortCode: 'LA',
    weightageMarks: '14-16 Marks',
    approxQuestions: 9,
    color: '#0891b2', // Cyan
    bgLight: '#ecfeff',
    borderColor: '#a5f3fc',
    description: 'Vector spaces, matrices, Gaussian elimination, eigenvalues/eigenvectors, projections, LU decomposition, and SVD.',
    recommendedBooks: ['Gilbert Strang - Introduction to Linear Algebra', 'Sheldon Axler - Linear Algebra Done Right'],
    topics: [
      {
        id: 'la_vector_spaces',
        subjectId: 'linear_algebra',
        title: 'Vector Spaces, Subspaces & Linear Independence',
        subtopics: ['Vector spaces and subspace criteria', 'Linear combination, span, and basis', 'Linear independence and Wronskian', 'Dimension, row space, and column space', 'Rank-Nullity Theorem'],
        weightageTier: 'Critical (High)',
        status: 'completed',
        confidenceScore: 5,
        lastRevised: '2026-09-22',
        nextRevisionDue: '2026-09-29',
        pyqsTotal: 38,
        pyqsSolved: 38,
        pyqAccuracy: 95,
        formulas: [
          {
            id: 'rank_nullity',
            title: 'Fundamental Rank-Nullity Theorem',
            latex: 'Rank(A) + Nullity(A) = n \\quad (\\text{where } A \\in \\mathbb{R}^{m \\times n})',
            plainText: 'dim(Col A) + dim(Null A) = n',
            explanation: 'Sum of dimensions of column space and null space equals total number of columns n.',
            tag: 'Fundamental'
          }
        ],
        commonTraps: [
          'A subspace must always contain the zero vector and be closed under vector addition and scalar multiplication.',
          'Rank(A) ≤ min(m, n). Product Rank(AB) ≤ min(Rank(A), Rank(B)).'
        ]
      },
      {
        id: 'la_matrices_systems',
        subjectId: 'linear_algebra',
        title: 'Matrices, Gaussian Elimination & System of Equations',
        subtopics: ['Matrix multiplication properties', 'System of linear equations Ax = b', 'Row echelon and reduced row echelon form', 'Determinant properties and trace', 'Inverse matrix conditions'],
        weightageTier: 'Core (Medium)',
        status: 'completed',
        confidenceScore: 5,
        lastRevised: '2026-09-19',
        nextRevisionDue: '2026-09-27',
        pyqsTotal: 35,
        pyqsSolved: 35,
        pyqAccuracy: 92,
        formulas: [
          {
            id: 'consistency_criterion',
            title: 'Rouché–Capelli Consistency Criterion',
            latex: 'Rank(A) = Rank([A|b]) \\iff \\text{System is consistent (Unique if } Rank = n\\text{, Infinite if } Rank < n\\text{)}',
            plainText: 'Consistent if Rank(A) == Rank([A|b])',
            explanation: 'Governs solvability of linear systems. If Rank(A) < Rank([A|b]), system has no solution.',
            tag: 'Systems'
          }
        ],
        commonTraps: [
          'det(A + B) ≠ det(A) + det(B) in general! But det(AB) = det(A) det(B).',
          'det(c A) = c^n det(A) for an n × n matrix.'
        ]
      },
      {
        id: 'la_eigenvalues',
        subjectId: 'linear_algebra',
        title: 'Eigenvalues, Eigenvectors & Diagonalization',
        subtopics: ['Characteristic equation det(A - λI) = 0', 'Algebraic and Geometric Multiplicity', 'Properties of Symmetric and Orthogonal matrices', 'Diagonalization condition A = PDP⁻¹', 'Cayley-Hamilton Theorem'],
        weightageTier: 'Critical (High)',
        status: 'in_progress',
        confidenceScore: 4,
        lastRevised: '2026-09-21',
        nextRevisionDue: '2026-09-28',
        pyqsTotal: 45,
        pyqsSolved: 32,
        pyqAccuracy: 88,
        formulas: [
          {
            id: 'trace_det_eigen',
            title: 'Trace & Determinant Spectral Relations',
            latex: '\\sum_{i=1}^n \\lambda_i = \\text{Trace}(A), \\quad \\prod_{i=1}^n \\lambda_i = \\det(A)',
            plainText: 'Sum(λi) = Trace(A), Product(λi) = Det(A)',
            explanation: 'Crucial shortcut for finding missing eigenvalues in 2×2 and 3×3 GATE questions.',
            tag: 'Spectral'
          },
          {
            id: 'spectral_theorem',
            title: 'Spectral Theorem for Real Symmetric Matrices',
            latex: 'A = Q \\Lambda Q^T \\quad (Q \\text{ is orthogonal}, \\Lambda \\text{ real diagonal})',
            plainText: 'A = Q * Λ * Q^T with real eigenvalues and orthonormal eigenvectors',
            explanation: 'Real symmetric matrices are always orthogonally diagonalizable.',
            tag: 'Symmetric'
          }
        ],
        commonTraps: [
          'Matrix is diagonalizable iff Algebraic Multiplicity = Geometric Multiplicity for all eigenvalues.',
          'Eigenvalues of upper/lower triangular and diagonal matrices are strictly their diagonal entries.'
        ]
      },
      {
        id: 'la_svd_decompositions',
        subjectId: 'linear_algebra',
        title: 'Projections, LU Decomposition & SVD (Singular Value Decomposition)',
        subtopics: ['Orthogonal projection onto subspace: P = A(AᵀA)⁻¹Aᵀ', 'LU decomposition without and with pivoting', 'Singular Value Decomposition A = U Σ Vᵀ', 'Low-rank matrix approximation (Eckart-Young)', 'Pseudoinverse (Moore-Penrose)'],
        weightageTier: 'Critical (High)',
        status: 'in_progress',
        confidenceScore: 3,
        lastRevised: '2026-09-23',
        nextRevisionDue: '2026-09-25',
        pyqsTotal: 28,
        pyqsSolved: 16,
        pyqAccuracy: 81,
        formulas: [
          {
            id: 'svd_formula',
            title: 'Singular Value Decomposition (SVD)',
            latex: 'A = U \\Sigma V^T = \\sum_{i=1}^r \\sigma_i u_i v_i^T, \\quad \\sigma_i = \\sqrt{\\lambda_i(A^T A)}',
            plainText: 'A = U * Σ * V^T',
            explanation: 'Decomposes any m×n matrix into orthogonal columns U, non-negative singular values Σ, and orthogonal rows V.',
            tag: 'Decomposition'
          },
          {
            id: 'projection_matrix',
            title: 'Subspace Orthogonal Projection Matrix',
            latex: 'P = A(A^T A)^{-1}A^T, \\quad P^2 = P \\text{ (Idempotent)}, \\quad P^T = P \\text{ (Symmetric)}',
            plainText: 'P = A(A^T A)^-1 A^T',
            explanation: 'Projects any vector onto column space of A; eigenvalues of P can only be 0 or 1.',
            tag: 'Projection'
          }
        ],
        commonTraps: [
          'Singular values σ_i are always non-negative and sorted in descending order.',
          'Projection matrix is always symmetric (P = Pᵀ) and idempotent (P² = P).'
        ]
      }
    ]
  },
  {
    id: 'calculus_opt',
    name: 'Calculus and Optimization',
    shortCode: 'CALC',
    weightageMarks: '10-12 Marks',
    approxQuestions: 6,
    color: '#059669', // Emerald
    bgLight: '#ecfdf5',
    borderColor: '#a7f3d0',
    description: 'Single and multivariable calculus, gradients, Hessians, unconstrained/constrained optimization, Lagrange multipliers, gradient descent.',
    recommendedBooks: ['James Stewart - Multivariable Calculus', 'Stephen Boyd - Convex Optimization'],
    topics: [
      {
        id: 'calc_single_var',
        subjectId: 'calculus_opt',
        title: 'Single Variable Calculus & Taylor Series',
        subtopics: ['Limits, continuity, and differentiability', 'L’Hôpital’s rule and indeterminate forms', 'Mean Value Theorems (Rolle’s & Lagrange)', 'Taylor and Maclaurin series expansion', 'Single-variable maxima and minima'],
        weightageTier: 'Core (Medium)',
        status: 'completed',
        confidenceScore: 4,
        lastRevised: '2026-09-17',
        nextRevisionDue: '2026-09-25',
        pyqsTotal: 30,
        pyqsSolved: 28,
        pyqAccuracy: 89,
        formulas: [
          {
            id: 'taylor_expansion',
            title: 'Taylor Series Expansion',
            latex: 'f(x) = \\sum_{k=0}^\\infty \\frac{f^{(k)}(a)}{k!} (x - a)^k = f(a) + f\'(a)(x-a) + \\frac{f\'\'(a)}{2!}(x-a)^2 + \\dots',
            plainText: 'f(x) = f(a) + f\'(a)(x-a) + f\'\'(a)/2! (x-a)^2 + ...',
            explanation: 'Approximates differentiable function around point a. Quadratic approximation forms the basis of Newton optimization.',
            tag: 'Approximation'
          }
        ],
        commonTraps: [
          'Differentiability implies continuity, but continuity does NOT imply differentiability (e.g. f(x) = |x| at 0).',
          'Always check hypotheses of Rolle’s theorem (closed interval continuity, open interval differentiability) before applying.'
        ]
      },
      {
        id: 'calc_multivar_opt',
        subjectId: 'calculus_opt',
        title: 'Multivariable Gradient, Hessian & Optimization',
        subtopics: ['Partial derivatives and directional derivative', 'Gradient vector ∇f and steepest ascent', 'Hessian matrix H(f) and second derivative test', 'Lagrange Multipliers for constrained optimization', 'Gradient Descent algorithm & convergence rate'],
        weightageTier: 'Critical (High)',
        status: 'in_progress',
        confidenceScore: 4,
        lastRevised: '2026-09-22',
        nextRevisionDue: '2026-09-29',
        pyqsTotal: 32,
        pyqsSolved: 20,
        pyqAccuracy: 85,
        formulas: [
          {
            id: 'hessian_test',
            title: 'Hessian Second Derivative Test',
            latex: 'H(x) = \\begin{bmatrix} \\frac{\\partial^2 f}{\\partial x^2} & \\frac{\\partial^2 f}{\\partial x \\partial y} \\\\ \\frac{\\partial^2 f}{\\partial y \\partial x} & \\frac{\\partial^2 f}{\\partial y^2} \\end{bmatrix}, \\quad H \\succ 0 \\implies \\text{Min}, \\quad H \\prec 0 \\implies \\text{Max}',
            plainText: 'Hessian positive definite => local minimum; negative definite => local maximum; indefinite => saddle point',
            explanation: 'Eigenvalues of Hessian classify critical points in multi-dimensional loss landscapes.',
            tag: 'Second-Order'
          },
          {
            id: 'gradient_descent_update',
            title: 'Gradient Descent Update Rule',
            latex: '\\theta_{t+1} = \\theta_t - \\eta \\nabla f(\\theta_t)',
            plainText: 'theta_{t+1} = theta_t - eta * grad(f(theta_t))',
            explanation: 'Fundamental first-order iterative optimization method for minimizing differentiable loss functions.',
            tag: 'Optimization'
          }
        ],
        commonTraps: [
          'Directional derivative is maximized in direction of gradient ∇f, and value equals magnitude ||∇f||.',
          'Saddle point occurs when Hessian has both positive and negative eigenvalues (indefinite).'
        ]
      }
    ]
  },
  {
    id: 'dsa_python',
    name: 'Programming, Data Structures & Algorithms',
    shortCode: 'DSA',
    weightageMarks: '14-16 Marks',
    approxQuestions: 9,
    color: '#d97706', // Amber
    bgLight: '#fffbeb',
    borderColor: '#fde68a',
    description: 'Python fundamentals, recursion, asymptotic notation, stacks, queues, linked lists, trees, heaps, searching, sorting, graphs, and shortest path algorithms.',
    recommendedBooks: ['CLRS - Introduction to Algorithms', 'Mark Allen Weiss - Data Structures and Algorithm Analysis'],
    topics: [
      {
        id: 'dsa_python_core',
        subjectId: 'dsa_python',
        title: 'Python Language Semantics & OOP',
        subtopics: ['Mutability (lists, dicts, sets vs tuples, strings)', 'List comprehensions and generators', 'Scope resolution (LEGB rule)', 'Recursion depth and call stack mechanics', 'Classes, dunder methods, and inheritance'],
        weightageTier: 'Core (Medium)',
        status: 'completed',
        confidenceScore: 5,
        lastRevised: '2026-09-15',
        nextRevisionDue: '2026-09-28',
        pyqsTotal: 25,
        pyqsSolved: 25,
        pyqAccuracy: 96,
        formulas: [
          {
            id: 'python_slicing',
            title: 'Python Slice & Time Complexity',
            latex: '\\text{arr}[i:j:k] \\implies \\mathcal{O}(|j - i| / k) \\text{ space and time (creates new list)}',
            plainText: 'arr[i:j:k] creates a shallow copy',
            explanation: 'List slicing creates a new copy in memory, unlike NumPy views.',
            tag: 'Complexity'
          }
        ],
        commonTraps: [
          'Default mutable arguments (e.g. def fn(x=[]):) persist across function invocations!',
          'is compares memory identity (id); == compares structural equality.'
        ]
      },
      {
        id: 'dsa_trees_graphs',
        subjectId: 'dsa_python',
        title: 'Trees, Heaps, and Graph Traversals',
        subtopics: ['Binary Search Trees (BST) insertions & deletions', 'AVL & Balanced tree rotations', 'Binary Heaps and Priority Queues (Heapify in O(n))', 'BFS and DFS graph traversals', 'Dijkstra’s shortest path algorithm (O((V+E)log V))'],
        weightageTier: 'Critical (High)',
        status: 'completed',
        confidenceScore: 4,
        lastRevised: '2026-09-20',
        nextRevisionDue: '2026-09-27',
        pyqsTotal: 40,
        pyqsSolved: 36,
        pyqAccuracy: 90,
        formulas: [
          {
            id: 'dijkstra_complexity',
            title: 'Dijkstra Graph Complexity',
            latex: '\\mathcal{O}((V + E) \\log V) \\text{ with Min-Heap}; \\quad \\text{Fails with negative edge weights}',
            plainText: 'O((V + E) log V) with binary heap',
            explanation: 'Greedy shortest path algorithm from single source on weighted graph with non-negative edges.',
            tag: 'Graphs'
          }
        ],
        commonTraps: [
          'Dijkstra fails completely in presence of negative weight edges (Bellman-Ford needed).',
          'Building a binary heap from unordered array takes O(n) time, NOT O(n log n)!'
        ]
      },
      {
        id: 'dsa_sorting_searching',
        subjectId: 'dsa_python',
        title: 'Asymptotics, Divide & Conquer, Sorting Algorithms',
        subtopics: ['Big-O, Omega, Theta asymptotic notation', 'Master Theorem for divide-and-conquer recurrences', 'Merge Sort and Quick Sort (Partition mechanics)', 'Linear search and Binary Search invariants', 'Lower bound of comparison-based sorting Ω(n log n)'],
        weightageTier: 'Critical (High)',
        status: 'in_progress',
        confidenceScore: 4,
        lastRevised: '2026-09-21',
        nextRevisionDue: '2026-09-28',
        pyqsTotal: 34,
        pyqsSolved: 26,
        pyqAccuracy: 88,
        formulas: [
          {
            id: 'master_theorem',
            title: 'Master Theorem for Recurrences',
            latex: 'T(n) = a T(n/b) + \\mathcal{O}(n^d) \\implies \\begin{cases} \\mathcal{O}(n^{\\log_b a}) & \\text{if } d < \\log_b a \\\\ \\mathcal{O}(n^d \\log n) & \\text{if } d = \\log_b a \\\\ \\mathcal{O}(n^d) & \\text{if } d > \\log_b a \\end{cases}',
            plainText: 'T(n) = a T(n/b) + O(n^d)',
            explanation: 'Instantly solves divide-and-conquer recurrences such as Merge Sort a=2, b=2, d=1 => O(n log n).',
            tag: 'Asymptotics'
          }
        ],
        commonTraps: [
          'QuickSort worst-case time is O(n²) when pivot chosen is always extreme (already sorted array with first element as pivot).',
          'Merge sort requires O(n) auxiliary memory for linked-lists/arrays.'
        ]
      }
    ]
  },
  {
    id: 'dbms_warehouse',
    name: 'Database Management & Warehousing',
    shortCode: 'DBMS',
    weightageMarks: '10-12 Marks',
    approxQuestions: 6,
    color: '#7c3aed', // Purple
    bgLight: '#f5f3ff',
    borderColor: '#ddd6fe',
    description: 'Relational model, SQL, Relational Algebra, Normalization (1NF, 2NF, 3NF, BCNF), Indexing (B-trees, B+ trees), Transactions & ACID, Data Warehousing schemas.',
    recommendedBooks: ['Silberschatz, Korth, Sudarshan - Database System Concepts', 'Elmasri & Navathe - Fundamentals of Database Systems'],
    topics: [
      {
        id: 'dbms_relational_sql',
        subjectId: 'dbms_warehouse',
        title: 'Relational Algebra & Advanced SQL',
        subtopics: ['Selection, Projection, Cartesian Product, Natural Join', 'Division operator and universal quantification', 'SQL aggregation, HAVING, correlated subqueries', 'Integrity constraints: Primary, Foreign, Candidate keys', 'Tuple relational calculus'],
        weightageTier: 'Critical (High)',
        status: 'completed',
        confidenceScore: 4,
        lastRevised: '2026-09-16',
        nextRevisionDue: '2026-09-26',
        pyqsTotal: 30,
        pyqsSolved: 27,
        pyqAccuracy: 90,
        formulas: [
          {
            id: 'relational_division',
            title: 'Relational Division (R ÷ S)',
            latex: 'R \\div S = \\pi_{R-S}(R) - \\pi_{R-S}((\\pi_{R-S}(R) \\times S) - R)',
            plainText: 'Finds tuples in R associated with ALL tuples in S',
            explanation: 'Used for queries requiring "ALL" conditions (e.g. students who took ALL courses).',
            tag: 'Algebra'
          }
        ],
        commonTraps: [
          'WHERE filters row-by-row before aggregation; HAVING filters groups after GROUP BY aggregation.',
          'NULL values in SQL: arithmetic with NULL results in NULL; COUNT(*) counts NULLs, but COUNT(column) ignores them!'
        ]
      },
      {
        id: 'dbms_normalization',
        subjectId: 'dbms_warehouse',
        title: 'Functional Dependencies & Normal Forms',
        subtopics: ['Closure of attribute sets X⁺', 'Minimal cover computation', '1NF, 2NF (No partial dependency)', '3NF (Strictly transitive dependency elimination)', 'BCNF (Boyce-Codd Normal Form) and Lossless Join test', 'Dependency preservation testing'],
        weightageTier: 'Critical (High)',
        status: 'in_progress',
        confidenceScore: 4,
        lastRevised: '2026-09-22',
        nextRevisionDue: '2026-09-28',
        pyqsTotal: 36,
        pyqsSolved: 25,
        pyqAccuracy: 84,
        formulas: [
          {
            id: 'bcnf_criterion',
            title: 'BCNF Condition',
            latex: '\\forall X \\to Y, \\quad X \\text{ must be a Super Key}',
            plainText: 'For every functional dependency X -> Y, X is a superkey',
            explanation: 'Eliminates all redundancy based on functional dependencies. Lossless decomposition always possible, but dependency preservation not guaranteed.',
            tag: 'Normal Forms'
          }
        ],
        commonTraps: [
          'BCNF decomposition is always lossless, but does NOT always preserve dependencies!',
          '3NF decomposition can ALWAYS achieve both lossless join AND dependency preservation.'
        ]
      },
      {
        id: 'dbms_indexing_acid',
        subjectId: 'dbms_warehouse',
        title: 'B+ Trees, Transactions & Concurrency Control',
        subtopics: ['B-Tree vs B+ Tree node order and search bounds', 'ACID properties and schedule serializability', 'Conflict serializability & Precedence graph testing', 'Two-Phase Locking (2PL) and Strict 2PL', 'Data Warehousing: Star vs Snowflake schema'],
        weightageTier: 'Critical (High)',
        status: 'revision_due',
        confidenceScore: 3,
        lastRevised: '2026-09-10',
        nextRevisionDue: '2026-09-24',
        pyqsTotal: 28,
        pyqsSolved: 18,
        pyqAccuracy: 78,
        formulas: [
          {
            id: 'bplus_tree_nodes',
            title: 'B+ Tree Node Capacity',
            latex: '\\text{Internal Node: } \\lceil m/2 \\rceil \\le \\text{pointers} \\le m, \\quad \\text{Leaf Node: } \\lceil (m-1)/2 \\rceil \\le \\text{keys} \\le m-1',
            plainText: 'Internal min pointers = ceil(m/2)',
            explanation: 'Ensures tree remains balanced with logarithmic height O(log_m N) for disk block reads.',
            tag: 'Indexing'
          }
        ],
        commonTraps: [
          'Conflict serializable implies view serializable, but reverse is NOT true!',
          'Basic 2PL guarantees conflict serializability, but does NOT prevent cascading rollbacks or deadlocks. Strict 2PL prevents cascading rollbacks.'
        ]
      }
    ]
  },
  {
    id: 'machine_learning',
    name: 'Machine Learning',
    shortCode: 'ML',
    weightageMarks: '16-18 Marks',
    approxQuestions: 11,
    color: '#2563eb', // Blue
    bgLight: '#eff6ff',
    borderColor: '#bfdbfe',
    description: 'Supervised learning: Linear/Logistic regression, Ridge, SVM, Decision Trees, k-NN, Naive Bayes. Unsupervised: k-Means, PCA, Hierarchical clustering. Multi-layer perceptrons, Bias-Variance tradeoff.',
    recommendedBooks: ['Christopher Bishop - Pattern Recognition and Machine Learning', 'Trevor Hastie - Elements of Statistical Learning'],
    topics: [
      {
        id: 'ml_regression_class',
        subjectId: 'machine_learning',
        title: 'Linear, Logistic & Ridge Regression',
        subtopics: ['Ordinary Least Squares (OLS) closed-form solution', 'Ridge (L2) vs Lasso (L1) regularization', 'Logistic regression: Sigmoid function & Cross-Entropy loss', 'Odds ratio and decision boundaries', 'Gradient descent for parameter optimization'],
        weightageTier: 'Critical (High)',
        status: 'completed',
        confidenceScore: 5,
        lastRevised: '2026-09-21',
        nextRevisionDue: '2026-09-29',
        pyqsTotal: 42,
        pyqsSolved: 40,
        pyqAccuracy: 92,
        formulas: [
          {
            id: 'ols_closed_form',
            title: 'OLS Normal Equation',
            latex: '\\mathbf{w}^* = (\\mathbf{X}^T \\mathbf{X})^{-1} \\mathbf{X}^T \\mathbf{y}, \\quad \\mathbf{w}_{ridge}^* = (\\mathbf{X}^T \\mathbf{X} + \\lambda \\mathbf{I})^{-1} \\mathbf{X}^T \\mathbf{y}',
            plainText: 'w = (X^T * X)^-1 * X^T * y',
            explanation: 'Closed form solution for linear regression. Ridge adds λI to ensure invertibility even when X^T X is singular or multicollinear.',
            tag: 'Regression'
          },
          {
            id: 'logistic_sigmoid',
            title: 'Logistic Hypothesis & Binary Cross-Entropy',
            latex: '\\sigma(z) = \\frac{1}{1 + e^{-z}}, \\quad \\mathcal{L}(\\mathbf{w}) = -\\sum_{i=1}^n \\left[ y_i \\log \\hat{y}_i + (1 - y_i) \\log(1 - \\hat{y}_i) \\right]',
            plainText: 'Loss = - [ y * log(y_hat) + (1-y) * log(1-y_hat) ]',
            explanation: 'Convex loss function for binary classification guaranteeing global minimum via gradient descent.',
            tag: 'Classification'
          }
        ],
        commonTraps: [
          'Lasso (L1) produces sparse weight vectors (feature selection); Ridge (L2) shrinks weights continuously towards zero but never exact zero.',
          'Logistic regression decision boundary is linear in feature space: w^T x + b = 0.'
        ]
      },
      {
        id: 'ml_svm_trees',
        subjectId: 'machine_learning',
        title: 'Support Vector Machines (SVM) & Decision Trees',
        subtopics: ['Maximum margin hyperplane and Support Vectors', 'Primal vs Dual formulation and Kernel trick', 'Soft-margin SVM (C parameter and slack variables)', 'Decision Trees: Information Gain (Entropy) and Gini Impurity', 'Pruning, tree depth, and overfitting control'],
        weightageTier: 'Critical (High)',
        status: 'in_progress',
        confidenceScore: 4,
        lastRevised: '2026-09-23',
        nextRevisionDue: '2026-09-30',
        pyqsTotal: 48,
        pyqsSolved: 34,
        pyqAccuracy: 88,
        formulas: [
          {
            id: 'svm_margin',
            title: 'SVM Margin & Optimization Objective',
            latex: '\\text{Margin} = \\frac{2}{\\|\\mathbf{w}\\|}, \\quad \\min_{\\mathbf{w}, b} \\frac{1}{2}\\|\\mathbf{w}\\|^2 + C \\sum_{i=1}^n \\xi_i',
            plainText: 'Margin = 2 / ||w||',
            explanation: 'Maximizing margin is equivalent to minimizing ||w||^2 / 2 subject to classification margin constraints.',
            tag: 'Margin'
          },
          {
            id: 'entropy_gini',
            title: 'Information Entropy & Gini Impurity',
            latex: 'H(S) = -\\sum_{i=1}^C p_i \\log_2(p_i), \\quad \\text{Gini}(S) = 1 - \\sum_{i=1}^C p_i^2',
            plainText: 'Entropy = -sum(p * log2(p)), Gini = 1 - sum(p^2)',
            explanation: 'Measures of node impurity for splitting decisions in CART and ID3 decision trees.',
            tag: 'Trees'
          }
        ],
        commonTraps: [
          'In SVM, removing non-support vector data points does NOT change the decision boundary at all!',
          'Large C in SVM penalizes slack variables heavily => smaller margin, risk of overfitting. Small C => wider margin, tolerant to misclassification.'
        ]
      },
      {
        id: 'ml_unsupervised_pca',
        subjectId: 'machine_learning',
        title: 'k-Means Clustering & PCA (Dimensionality Reduction)',
        subtopics: ['k-Means algorithm Lloyd heuristic and objective function', 'k-Means initialization sensitivity (k-Means++)', 'Hierarchical Agglomerative Clustering (Single, Complete, Average linkage)', 'Principal Component Analysis (PCA) eigenvalue formulation', 'Explained variance ratio and reconstruction error'],
        weightageTier: 'Critical (High)',
        status: 'in_progress',
        confidenceScore: 4,
        lastRevised: '2026-09-22',
        nextRevisionDue: '2026-09-29',
        pyqsTotal: 36,
        pyqsSolved: 24,
        pyqAccuracy: 83,
        formulas: [
          {
            id: 'pca_objective',
            title: 'PCA Direction of Maximum Variance',
            latex: '\\mathbf{u}_1 = \\arg\\max_{\\|\\mathbf{u}\\|=1} \\mathbf{u}^T \\mathbf{\\Sigma} \\mathbf{u} \\implies \\mathbf{\\Sigma} \\mathbf{u} = \\lambda \\mathbf{u}',
            plainText: 'Principal components are eigenvectors of covariance matrix Σ',
            explanation: 'First principal component corresponds to eigenvector with largest eigenvalue λ1.',
            tag: 'Dimensionality'
          }
        ],
        commonTraps: [
          'PCA requires data centering (zero-mean) and variance normalization before calculating covariance matrix!',
          'Single linkage in hierarchical clustering suffers from chaining effect; complete linkage forms compact spherical clusters.'
        ]
      },
      {
        id: 'ml_bias_variance_nn',
        subjectId: 'machine_learning',
        title: 'Bias-Variance Tradeoff, Evaluation & Neural Nets',
        subtopics: ['Expected test error decomposition: Bias² + Variance + Irreducible error', 'k-Fold Cross Validation and Leave-One-Out (LOOCV)', 'Precision, Recall, F1-Score, ROC-AUC curve', 'Multi-Layer Perceptron (MLP) architecture', 'Backpropagation gradient derivation and activation functions (ReLU, Sigmoid)'],
        weightageTier: 'Critical (High)',
        status: 'revision_due',
        confidenceScore: 3,
        lastRevised: '2026-09-14',
        nextRevisionDue: '2026-09-24',
        pyqsTotal: 40,
        pyqsSolved: 22,
        pyqAccuracy: 77,
        formulas: [
          {
            id: 'bias_var_decomp',
            title: 'Bias-Variance Error Decomposition',
            latex: '\\mathbb{E}[(y - \\hat{f}(x))^2] = \\text{Bias}[\\hat{f}(x)]^2 + \\text{Var}[\\hat{f}(x)] + \\sigma^2',
            plainText: 'Total Error = (Bias)^2 + Variance + Irreducible Noise',
            explanation: 'High model complexity decreases bias but increases variance; regularizers manage this tradeoff.',
            tag: 'Generalization'
          },
          {
            id: 'f1_score',
            title: 'F1-Score (Harmonic Mean)',
            latex: 'F_1 = 2 \\cdot \\frac{\\text{Precision} \\cdot \\text{Recall}}{\\text{Precision} + \\text{Recall}} = \\frac{2TP}{2TP + FP + FN}',
            plainText: 'F1 = 2 * (P * R) / (P + R)',
            explanation: 'Used over accuracy when classes are imbalanced (e.g. anomaly detection, rare disease detection).',
            tag: 'Metrics'
          }
        ],
        commonTraps: [
          'High training error + high test error = High Bias (Underfitting). Low training error + high test error = High Variance (Overfitting).',
          'In ROC curves, True Positive Rate (Sensitivity) vs False Positive Rate (1 - Specificity) are plotted; independent of class distribution.'
        ]
      }
    ]
  },
  {
    id: 'artificial_intel',
    name: 'Artificial Intelligence',
    shortCode: 'AI',
    weightageMarks: '10-12 Marks',
    approxQuestions: 7,
    color: '#4f46e5', // Deep Indigo
    bgLight: '#eef2ff',
    borderColor: '#c7d2fe',
    description: 'Informed/Uninformed Search (BFS, DFS, A*, Heuristics), Adversarial Search (Minimax, Alpha-Beta Pruning), Propositional & First-Order Logic, Bayesian Networks & Conditional Independence.',
    recommendedBooks: ['Stuart Russell & Peter Norvig - Artificial Intelligence: A Modern Approach'],
    topics: [
      {
        id: 'ai_search_algorithms',
        subjectId: 'artificial_intel',
        title: 'Search Strategies & Heuristic Search (A*)',
        subtopics: ['State space formulation', 'BFS, DFS, Uniform Cost Search (UCS), Iterative Deepening', 'Admissible and Consistent heuristics for A*', 'A* optimality guarantees on tree vs graph search', 'Memory-bounded search (IDA*, SMA*)'],
        weightageTier: 'Critical (High)',
        status: 'completed',
        confidenceScore: 5,
        lastRevised: '2026-09-18',
        nextRevisionDue: '2026-09-28',
        pyqsTotal: 32,
        pyqsSolved: 30,
        pyqAccuracy: 93,
        formulas: [
          {
            id: 'astar_evaluation',
            title: 'A* Evaluation Function & Admissibility',
            latex: 'f(n) = g(n) + h(n), \\quad h(n) \\le h^*(n) \\text{ (Admissible)}',
            plainText: 'f(n) = g(n) + h(n) where h(n) never overestimates true cost',
            explanation: 'Guarantees finding optimal path if h is admissible on tree search, or consistent on graph search.',
            tag: 'Heuristics'
          },
          {
            id: 'consistency_triangle',
            title: 'Heuristic Consistency / Monotonicity',
            latex: 'h(n) \\le c(n, a, n\') + h(n\') \\implies f(n) \\text{ is non-decreasing along any path}',
            plainText: 'h(n) <= cost(n, n\') + h(n\')',
            explanation: 'Consistency implies admissibility and guarantees no node needs to be reopened in graph search.',
            tag: 'Optimality'
          }
        ],
        commonTraps: [
          'An admissible heuristic is NOT necessarily consistent! But every consistent heuristic is admissible.',
          'If h(n) = 0 for all nodes, A* reduces identically to Uniform Cost Search (Dijkstra).'
        ]
      },
      {
        id: 'ai_adversarial_logic',
        subjectId: 'artificial_intel',
        title: 'Adversarial Search & Alpha-Beta Pruning',
        subtopics: ['Two-player zero-sum games and Minimax value', 'Alpha-Beta pruning mechanics (alpha cutoff, beta cutoff)', 'Optimal move ordering efficiency O(b^(d/2))', 'Propositional logic resolution refutation', 'First-Order Logic (FOL) unification and Horn clauses'],
        weightageTier: 'Core (Medium)',
        status: 'in_progress',
        confidenceScore: 4,
        lastRevised: '2026-09-21',
        nextRevisionDue: '2026-09-29',
        pyqsTotal: 28,
        pyqsSolved: 20,
        pyqAccuracy: 85,
        formulas: [
          {
            id: 'alpha_beta_condition',
            title: 'Alpha-Beta Pruning Condition',
            latex: '\\alpha = \\text{best already explored for MAX}, \\quad \\beta = \\text{best for MIN}; \\quad \\text{Prune if } \\alpha \\ge \\beta',
            plainText: 'Prune branch if alpha >= beta',
            explanation: 'Prunes subtrees that cannot influence the final minimax decision, halving effective search depth.',
            tag: 'Pruning'
          }
        ],
        commonTraps: [
          'Alpha-Beta pruning NEVER changes the minimax value of the root node; it returns exact same result faster.',
          'Pruning order depends strictly on child evaluation order.'
        ]
      },
      {
        id: 'ai_bayes_networks',
        subjectId: 'artificial_intel',
        title: 'Reasoning Under Uncertainty & Bayesian Networks',
        subtopics: ['Directed Acyclic Graph (DAG) representation of joint distribution', 'Conditional independence and d-separation criteria', 'Markov blanket of a node (parents, children, children’s parents)', 'Exact inference: Variable Elimination', 'Factor multiplication and marginalization'],
        weightageTier: 'Critical (High)',
        status: 'in_progress',
        confidenceScore: 3,
        lastRevised: '2026-09-23',
        nextRevisionDue: '2026-09-26',
        pyqsTotal: 30,
        pyqsSolved: 18,
        pyqAccuracy: 80,
        formulas: [
          {
            id: 'bayes_net_factorization',
            title: 'Bayes Net Joint Distribution Chain Rule',
            latex: 'P(X_1, \\dots, X_n) = \\prod_{i=1}^n P(X_i \\mid \\text{Parents}(X_i))',
            plainText: 'P(X1...Xn) = Product of P(Xi | Parents(Xi))',
            explanation: 'Exploits conditional independence to reduce exponential 2^n parameter storage to local linear tables.',
            tag: 'Probability'
          }
        ],
        commonTraps: [
          'In V-structure (collider A -> C <- B): A and B are independent, but become DEPENDENT given C or any descendant of C!',
          'Markov blanket of node X consists of: its parents, its children, and other parents of its children.'
        ]
      }
    ]
  },
  {
    id: 'general_aptitude',
    name: 'General Aptitude (GA)',
    shortCode: 'GA',
    weightageMarks: '15 Marks',
    approxQuestions: 10,
    color: '#0d9488', // Teal
    bgLight: '#f0fdfa',
    borderColor: '#99f6e4',
    description: 'Verbal ability (grammar, vocabulary, reading comprehension) and Numerical/Analytical ability (data interpretation, logical deduction, spatial transformations).',
    recommendedBooks: ['R.S. Aggarwal - Quantitative Aptitude', 'Arun Sharma - Logical Reasoning for CAT/GATE'],
    topics: [
      {
        id: 'ga_quant_analytical',
        subjectId: 'general_aptitude',
        title: 'Quantitative & Analytical Aptitude',
        subtopics: ['Ratios, percentages, work & time, speed-distance', 'Data interpretation (tables, pie charts, bar graphs)', 'Syllogisms and deductive logic', 'Series completion and analogy', 'Spatial aptitude: folding, rotations, reflections'],
        weightageTier: 'Core (Medium)',
        status: 'completed',
        confidenceScore: 5,
        lastRevised: '2026-09-19',
        nextRevisionDue: '2026-09-28',
        pyqsTotal: 50,
        pyqsSolved: 48,
        pyqAccuracy: 94,
        formulas: [
          {
            id: 'work_time_formula',
            title: 'Work Rate Formulation',
            latex: '\\frac{1}{T_{total}} = \\sum_{i} \\frac{1}{T_i}',
            plainText: '1/TotalTime = 1/T1 + 1/T2',
            explanation: 'Work rates add linearly when agents work simultaneously.',
            tag: 'Arithmetic'
          }
        ],
        commonTraps: [
          'In syllogisms, "Some A are B" does NOT imply "Some A are not B". Stay strictly within formal existential quantifiers.',
          'Always check units when calculating average speed: 2xy / (x+y) for equal distance legs.'
        ]
      }
    ]
  },
  {
    id: 'mock_pyq',
    name: 'Mock Tests & PYQ Mastery',
    shortCode: 'MOCK',
    weightageMarks: 'Comprehensive',
    approxQuestions: 65,
    color: '#e11d48', // Rose
    bgLight: '#fff1f2',
    borderColor: '#fecdd3',
    description: 'Full-length simulation tests (65 questions, 100 marks, 180 mins), sectional drills, previous year question analysis, and high-yield trap reviews.',
    recommendedBooks: ['GATE DA 2024 & 2025 Official Papers', 'Made Easy / Ace Academy GATE DA Test Series'],
    topics: [
      {
        id: 'mock_full_length',
        subjectId: 'mock_pyq',
        title: 'Full Length CBT Simulations (100 Marks)',
        subtopics: ['65 Questions: 10 GA + 55 Technical (MCQ, MSQ, NAT)', 'Virtual scientific calculator discipline', 'Negative marking management (1/3rd for 1-mark, 2/3rd for 2-mark MCQ, 0 for NAT/MSQ)', 'Time allocation strategy (35 mins GA, 75 mins Core Math, 70 mins ML/AI)'],
        weightageTier: 'Critical (High)',
        status: 'in_progress',
        confidenceScore: 4,
        lastRevised: '2026-09-22',
        nextRevisionDue: '2026-09-27',
        pyqsTotal: 130,
        pyqsSolved: 110,
        pyqAccuracy: 84,
        formulas: [
          {
            id: 'expected_score_cbt',
            title: 'Expected Marks with Guessing Penalty',
            latex: '\\text{Score} = M_{correct} - \\left(\\frac{1}{3} M_{incorrect}^{(1)} + \\frac{2}{3} M_{incorrect}^{(2)}\\right)',
            plainText: 'Score = Correct - Negative marks (NAT/MSQ have 0 negative marks)',
            explanation: 'In MSQ and NAT there is zero negative marking — never leave a NAT or MSQ question unattempted if choices can be reasoned.',
            tag: 'Exam Strategy'
          }
        ],
        commonTraps: [
          'MSQs have NO partial marking! You must select ALL correct options and NO incorrect option to receive marks.',
          'Double check rounding bounds specified in question for NAT (e.g. "round to 2 decimal places").'
        ]
      }
    ]
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task_1',
    title: 'Solve 15 SVD & Low-Rank Approximation PYQs',
    subjectId: 'linear_algebra',
    topicTitle: 'Projections, LU Decomposition & SVD',
    type: 'pyq',
    durationMinutes: 60,
    completed: true,
    date: '2026-09-24',
    scheduledTime: '07:00 AM',
    priority: 'urgent',
    notes: 'Master Eckart-Young theorem and sigma rank reduction calculations.'
  },
  {
    id: 'task_2',
    title: 'Read Sheldon Ross Chapter 5: Poisson & Exponential Distribution',
    subjectId: 'prob_stat',
    topicTitle: 'Parametric Probability Distributions',
    type: 'textbook',
    durationMinutes: 45,
    completed: true,
    date: '2026-09-24',
    scheduledTime: '09:00 AM',
    priority: 'high',
    notes: 'Focus on memoryless proofs and Poisson process inter-arrival times.'
  },
  {
    id: 'task_3',
    title: 'Derive Backpropagation gradients for 2-layer MLP on paper',
    subjectId: 'machine_learning',
    topicTitle: 'Bias-Variance Tradeoff, Evaluation & Neural Nets',
    type: 'concept',
    durationMinutes: 50,
    completed: false,
    date: '2026-09-24',
    scheduledTime: '02:30 PM',
    priority: 'urgent',
    notes: 'Use vector calculus notation with Jacobian matrices.'
  },
  {
    id: 'task_4',
    title: 'Active Spaced Recall: Bayesian Network d-separation rules',
    subjectId: 'artificial_intel',
    topicTitle: 'Reasoning Under Uncertainty & Bayesian Networks',
    type: 'revision',
    durationMinutes: 30,
    completed: false,
    date: '2026-09-24',
    scheduledTime: '04:30 PM',
    priority: 'high',
    notes: 'Test active recall on collider vs non-collider paths with observed evidence.'
  },
  {
    id: 'task_5',
    title: 'Implement Dijkstra and analyze priority queue operations',
    subjectId: 'dsa_python',
    topicTitle: 'Trees, Heaps, and Graph Traversals',
    type: 'concept',
    durationMinutes: 45,
    completed: false,
    date: '2026-09-24',
    scheduledTime: '06:00 PM',
    priority: 'normal',
    notes: 'Verify heapq in Python vs custom indexed min-heap.'
  },
  {
    id: 'task_6',
    title: 'Review BCNF vs 3NF Decomposition proofs and losslessness test',
    subjectId: 'dbms_warehouse',
    topicTitle: 'Functional Dependencies & Normal Forms',
    type: 'revision',
    durationMinutes: 40,
    completed: false,
    date: '2026-09-24',
    scheduledTime: '08:30 PM',
    priority: 'high',
    notes: 'Ensure mastery of Chase algorithm for lossless join testing.'
  }
];

export const INITIAL_MOCK_TESTS: MockTest[] = [
  {
    id: 'mock_1',
    title: 'GATE DA National Open Mock 1',
    testType: 'Full Length',
    date: '2026-09-06',
    score: 64.33,
    totalMarks: 100,
    accuracy: 79.2,
    percentile: 98.4,
    timeTakenMinutes: 172,
    totalTimeMinutes: 180,
    strongAreas: ['Linear Algebra', 'General Aptitude', 'Python Programming'],
    weakAreas: ['Bayesian Networks Inference', 'Hypothesis Testing t-test', 'SVM Primal vs Dual']
  },
  {
    id: 'mock_2',
    title: 'Full Length CBT Simulation 2',
    testType: 'Full Length',
    date: '2026-09-13',
    score: 69.67,
    totalMarks: 100,
    accuracy: 83.1,
    percentile: 99.1,
    timeTakenMinutes: 168,
    totalTimeMinutes: 180,
    strongAreas: ['Probability Axioms', 'Matrices & Determinants', 'Calculus Optimization'],
    weakAreas: ['B+ Tree Index Calculations', 'Poisson Distribution NAT questions']
  },
  {
    id: 'mock_3',
    title: 'AIM-GATE DA Pro Mock 3',
    testType: 'Full Length',
    date: '2026-09-20',
    score: 74.00,
    totalMarks: 100,
    accuracy: 87.5,
    percentile: 99.6,
    timeTakenMinutes: 165,
    totalTimeMinutes: 180,
    strongAreas: ['Linear Algebra SVD', 'Machine Learning Regression', 'Relational Algebra'],
    weakAreas: ['A* Consistency vs Admissibility proof', 'Chi-Squared degrees of freedom']
  }
];

export const INITIAL_MILESTONES: Milestone[] = [
  {
    id: 'phase_1',
    phaseNumber: 1,
    phaseTitle: 'Foundations & Mathematical Rigor',
    timeframe: 'Months 1 - 5 (Jan 2026 - May 2026)',
    targetMonth: 'May 2026',
    topicsTarget: 45,
    status: 'completed',
    description: 'Master core Linear Algebra, Probability & Statistics, and Single/Multivariable Calculus with formal proofs and standard textbook exercises.',
    keyDeliverables: [
      'Complete Gilbert Strang Linear Algebra lectures & problem sets',
      'Sheldon Ross Probability chapters 1 to 8 mastery',
      'Solve 250+ fundamental math questions from CS/EC/DA previous years'
    ]
  },
  {
    id: 'phase_2',
    phaseNumber: 2,
    phaseTitle: 'CS Core: Algorithms & Database Systems',
    timeframe: 'Months 6 - 9 (Jun 2026 - Sep 2026)',
    targetMonth: 'Sep 2026',
    topicsTarget: 80,
    status: 'in_progress',
    description: 'Pythonic algorithm implementation, asymptotic rigor, balanced trees, graph algorithms, SQL relational algebra, and normalization.',
    keyDeliverables: [
      'CLRS Chapters on Sorting, BSTs, Heaps, and Graphs',
      'Korth / Navathe functional dependencies and BCNF lossless decomposition',
      '100% accuracy on Relational Algebra & SQL division queries'
    ]
  },
  {
    id: 'phase_3',
    phaseNumber: 3,
    phaseTitle: 'Machine Learning & AI Deep Dive',
    timeframe: 'Months 10 - 14 (Oct 2026 - Feb 2027)',
    targetMonth: 'Feb 2027',
    topicsTarget: 140,
    status: 'upcoming',
    description: 'Theoretical derivations of supervised models (SVM, Ridge, Decision Trees, MLPs) and unsupervised dimensionality reduction (PCA, k-Means, SVD).',
    keyDeliverables: [
      'Bishop PRML core mathematical derivations on paper',
      'Russell & Norvig AI search, Alpha-Beta pruning, and Bayesian Network inference',
      'Solve all GATE DA 2024, 2025, 2026 official papers with zero error margin'
    ]
  },
  {
    id: 'phase_4',
    phaseNumber: 4,
    phaseTitle: 'Comprehensive PYQ Drills & Subject Series',
    timeframe: 'Months 15 - 19 (Mar 2027 - Jul 2027)',
    targetMonth: 'Jul 2027',
    topicsTarget: 200,
    status: 'upcoming',
    description: 'Subject-wise intensive testing, spaced repetition of weak tags, and time-pressured NAT / MSQ drill sheets.',
    keyDeliverables: [
      '50+ Subject-wise mock tests (15 questions in 45 mins)',
      'Error log notebook auditing and trap prevention flashcard mastery',
      'Virtual scientific calculator speed optimization'
    ]
  },
  {
    id: 'phase_5',
    phaseNumber: 5,
    phaseTitle: 'Full CBT Simulation & AIR 1 Sprint',
    timeframe: 'Months 20 - 24 (Aug 2027 - Feb 2028)',
    targetMonth: 'Feb 2028',
    topicsTarget: 244,
    status: 'upcoming',
    description: 'Peak exam simulation: 30+ full-length computer-based tests, biological clock synchronization (09:30 - 12:30 exam slot), and final revision sheets.',
    keyDeliverables: [
      '30 full length mock tests targeting consistently 85+ / 100',
      'Complete 1-page condensed formula sheets for all 9 subjects',
      'Peak psychological readiness and mental stamina for 3-hour marathon'
    ]
  }
];

export const INITIAL_CALENDAR_EVENTS: CalendarEvent[] = [
  {
    id: 'cal_1',
    date: '2026-09-24',
    title: 'Deep Math: SVD & Parametric Distributions',
    type: 'study_block',
    subjectId: 'linear_algebra',
    time: '07:00 AM',
    duration: '2.5 hrs'
  },
  {
    id: 'cal_2',
    date: '2026-09-24',
    title: 'Spaced Recall: Bayes Nets & d-separation',
    type: 'revision',
    subjectId: 'artificial_intel',
    time: '04:30 PM',
    duration: '1 hr'
  },
  {
    id: 'cal_3',
    date: '2026-09-26',
    title: 'Spaced Revision: Probability Axioms & RVs',
    type: 'revision',
    subjectId: 'prob_stat',
    time: '09:00 AM',
    duration: '2 hrs'
  },
  {
    id: 'cal_4',
    date: '2026-09-27',
    title: 'National GATE DA Simulation Mock 4',
    type: 'mock',
    subjectId: 'mock_pyq',
    time: '09:30 AM',
    duration: '3 hrs'
  },
  {
    id: 'cal_5',
    date: '2026-09-30',
    title: 'Phase 2 CS Core Milestone Audit',
    type: 'milestone',
    time: '06:00 PM',
    duration: '1.5 hrs'
  },
  {
    id: 'cal_6',
    date: '2026-10-04',
    title: 'Machine Learning Subject Test 1 (Regression & SVM)',
    type: 'mock',
    subjectId: 'machine_learning',
    time: '10:00 AM',
    duration: '1.5 hrs'
  }
];

export const createFreshZeroSubjects = (): Subject[] => {
  return INITIAL_SUBJECTS.map((subject) => ({
    ...subject,
    topics: subject.topics.map((topic) => ({
      ...topic,
      status: 'unvisited',
      confidenceScore: 1,
      pyqsSolved: 0,
      pyqAccuracy: 0,
      lastRevised: undefined,
      nextRevisionDue: undefined,
    })),
  }));
};
