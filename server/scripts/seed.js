/**
 * DevPrep - Database Seeding Script (`seed.js`)
 * 
 * Phase 5 Incremental Extension:
 * 1. Seeds admin and demo accounts into `users.json`.
 * 2. Seeds 36 curated DSA problems (4 across each of the 9 required topics) into `questions.json`.
 * 3. Seeds demo user's solved questions, active streak, and activity feed in `progress.json`.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { writeJson, readJson, FILES } = require('../utils/fileDb');

const QUESTIONS_DATA = [
  // --- 1. ARRAYS ---
  {
    id: 'q-arr-1',
    title: 'Two Sum',
    topic: 'Arrays',
    difficulty: 'Easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    solutionApproach: 'Use a hash map to store each number and its index. For each element x, check if (target - x) exists in the map. This achieves O(n) time complexity and O(n) space complexity.',
    functionName: "twoSum",
    starterCode: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nfunction twoSum(nums, target) {\n  // Write your code here\n}",
    compare: "unorderedArray",
    testCases: [
          {
                "args": [
                      [
                            2,
                            7,
                            11,
                            15
                      ],
                      9
                ],
                "expected": [
                      0,
                      1
                ],
                "hidden": false
          },
          {
                "args": [
                      [
                            3,
                            2,
                            4
                      ],
                      6
                ],
                "expected": [
                      1,
                      2
                ],
                "hidden": false
          },
          {
                "args": [
                      [
                            3,
                            3
                      ],
                      6
                ],
                "expected": [
                      0,
                      1
                ],
                "hidden": false
          },
          {
                "args": [
                      [
                            1,
                            5,
                            8,
                            3
                      ],
                      13
                ],
                "expected": [
                      1,
                      2
                ],
                "hidden": true
          },
          {
                "args": [
                      [
                            -3,
                            4,
                            3,
                            90
                      ],
                      0
                ],
                "expected": [
                      0,
                      2
                ],
                "hidden": true
          }
    ]
  },
  {
    id: 'q-arr-2',
    title: 'Best Time to Buy and Sell Stock',
    topic: 'Arrays',
    difficulty: 'Easy',
    description: 'You are given an array prices where prices[i] is the price of a given stock on the ith day. You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.',
    examples: [
      { input: 'prices = [7,1,5,3,6,4]', output: '5' },
      { input: 'prices = [7,6,4,3,1]', output: '0' }
    ],
    constraints: ['1 <= prices.length <= 10^5', '0 <= prices[i] <= 10^4'],
    solutionApproach: 'Maintain a running minimum price seen so far. At each step, calculate the potential profit if sold today, updating the maximum profit found. Time complexity is O(n) with O(1) space.',
    functionName: "maxProfit",
    starterCode: "/**\n * @param {number[]} prices\n * @return {number}\n */\nfunction maxProfit(prices) {\n  // Write your code here\n}",
    compare: "exact",
    testCases: [
          {
                "args": [
                      [
                            7,
                            1,
                            5,
                            3,
                            6,
                            4
                      ]
                ],
                "expected": 5,
                "hidden": false
          },
          {
                "args": [
                      [
                            7,
                            6,
                            4,
                            3,
                            1
                      ]
                ],
                "expected": 0,
                "hidden": false
          },
          {
                "args": [
                      [
                            2,
                            4,
                            1
                      ]
                ],
                "expected": 2,
                "hidden": false
          },
          {
                "args": [
                      [
                            1,
                            2
                      ]
                ],
                "expected": 1,
                "hidden": true
          },
          {
                "args": [
                      [
                            3,
                            2,
                            6,
                            5,
                            0,
                            3
                      ]
                ],
                "expected": 4,
                "hidden": true
          }
    ]
  },
  {
    id: 'q-arr-3',
    title: 'Maximum Subarray',
    topic: 'Arrays',
    difficulty: 'Medium',
    description: 'Given an integer array nums, find the subarray with the largest sum, and return its sum.',
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6' },
      { input: 'nums = [1]', output: '1' }
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    solutionApproach: "Use Kadane's Algorithm. Iterate through the array keeping a running currentSum. If currentSum drops below zero, reset it to zero. Track the maximum sum encountered. Runs in O(n) time.",
    functionName: "maxSubArray",
    starterCode: "/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction maxSubArray(nums) {\n  // Write your code here\n}",
    compare: "exact",
    testCases: [
          {
                "args": [
                      [
                            -2,
                            1,
                            -3,
                            4,
                            -1,
                            2,
                            1,
                            -5,
                            4
                      ]
                ],
                "expected": 6,
                "hidden": false
          },
          {
                "args": [
                      [
                            1
                      ]
                ],
                "expected": 1,
                "hidden": false
          },
          {
                "args": [
                      [
                            5,
                            4,
                            -1,
                            7,
                            8
                      ]
                ],
                "expected": 23,
                "hidden": false
          },
          {
                "args": [
                      [
                            -1
                      ]
                ],
                "expected": -1,
                "hidden": true
          },
          {
                "args": [
                      [
                            -2,
                            -1
                      ]
                ],
                "expected": -1,
                "hidden": true
          }
    ]
  },
  {
    id: 'q-arr-4',
    title: 'Contains Duplicate',
    topic: 'Arrays',
    difficulty: 'Easy',
    description: 'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.',
    examples: [
      { input: 'nums = [1,2,3,1]', output: 'true' },
      { input: 'nums = [1,2,3,4]', output: 'false' }
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^9 <= nums[i] <= 10^9'],
    solutionApproach: 'Insert numbers into a Hash Set while iterating. If an element is already in the set, a duplicate exists. Time: O(n), Space: O(n).',
    functionName: "containsDuplicate",
    starterCode: "/**\n * @param {number[]} nums\n * @return {boolean}\n */\nfunction containsDuplicate(nums) {\n  // Write your code here\n}",
    compare: "exact",
    testCases: [
          {
                "args": [
                      [
                            1,
                            2,
                            3,
                            1
                      ]
                ],
                "expected": true,
                "hidden": false
          },
          {
                "args": [
                      [
                            1,
                            2,
                            3,
                            4
                      ]
                ],
                "expected": false,
                "hidden": false
          },
          {
                "args": [
                      [
                            1,
                            1,
                            1,
                            3,
                            3,
                            4,
                            3,
                            2,
                            4,
                            2
                      ]
                ],
                "expected": true,
                "hidden": false
          },
          {
                "args": [
                      [
                            100
                      ]
                ],
                "expected": false,
                "hidden": true
          },
          {
                "args": [
                      [
                            0,
                            4,
                            5,
                            0,
                            3,
                            6
                      ]
                ],
                "expected": true,
                "hidden": true
          }
    ]
  },

  // --- 2. STRINGS ---
  {
    id: 'q-str-1',
    title: 'Valid Anagram',
    topic: 'Strings',
    difficulty: 'Easy',
    description: 'Given two strings s and t, return true if t is an anagram of s, and false otherwise. An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase.',
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true' },
      { input: 's = "rat", t = "car"', output: 'false' }
    ],
    constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters.'],
    solutionApproach: 'Count character frequencies using an array of size 26 or a hash table. Increment counts for s and decrement for t. If all counts are zero, return true. Runs in O(n) time and O(1) space.',
    functionName: "isAnagram",
    starterCode: "/**\n * @param {string} s\n * @param {string} t\n * @return {boolean}\n */\nfunction isAnagram(s, t) {\n  // Write your code here\n}",
    compare: "exact",
    testCases: [
          {
                "args": [
                      "anagram",
                      "nagaram"
                ],
                "expected": true,
                "hidden": false
          },
          {
                "args": [
                      "rat",
                      "car"
                ],
                "expected": false,
                "hidden": false
          },
          {
                "args": [
                      "a",
                      "ab"
                ],
                "expected": false,
                "hidden": false
          },
          {
                "args": [
                      "listen",
                      "silent"
                ],
                "expected": true,
                "hidden": true
          },
          {
                "args": [
                      "aacc",
                      "ccac"
                ],
                "expected": false,
                "hidden": true
          }
    ]
  },
  {
    id: 'q-str-2',
    title: 'Longest Substring Without Repeating Characters',
    topic: 'Strings',
    difficulty: 'Medium',
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    examples: [
      { input: 's = "abcabcbb"', output: '3' },
      { input: 's = "bbbbb"', output: '1' }
    ],
    constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    solutionApproach: 'Use a sliding window with two pointers (left and right) and a hash map storing the last seen index of each character. Slide right, advance left if duplicate found. Runs in O(n) time.',
    functionName: "lengthOfLongestSubstring",
    starterCode: "/**\n * @param {string} s\n * @return {number}\n */\nfunction lengthOfLongestSubstring(s) {\n  // Write your code here\n}",
    compare: "exact",
    testCases: [
          {
                "args": [
                      "abcabcbb"
                ],
                "expected": 3,
                "hidden": false
          },
          {
                "args": [
                      "bbbbb"
                ],
                "expected": 1,
                "hidden": false
          },
          {
                "args": [
                      "pwwkew"
                ],
                "expected": 3,
                "hidden": false
          },
          {
                "args": [
                      ""
                ],
                "expected": 0,
                "hidden": true
          },
          {
                "args": [
                      "au"
                ],
                "expected": 2,
                "hidden": true
          },
          {
                "args": [
                      "dvdf"
                ],
                "expected": 3,
                "hidden": true
          }
    ]
  },
  {
    id: 'q-str-3',
    title: 'Valid Palindrome',
    topic: 'Strings',
    difficulty: 'Easy',
    description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
    examples: [
      { input: 's = "A man, a plan, a canal: Panama"', output: 'true' },
      { input: 's = "race a car"', output: 'false' }
    ],
    constraints: ['1 <= s.length <= 2 * 10^5'],
    solutionApproach: 'Use two pointers starting at opposite ends of the string. Move inward, skipping non-alphanumeric characters and comparing lowercase values. Runs in O(n) time and O(1) space.',
    functionName: "isPalindrome",
    starterCode: "/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isPalindrome(s) {\n  // Write your code here\n}",
    compare: "exact",
    testCases: [
          {
                "args": [
                      "A man, a plan, a canal: Panama"
                ],
                "expected": true,
                "hidden": false
          },
          {
                "args": [
                      "race a car"
                ],
                "expected": false,
                "hidden": false
          },
          {
                "args": [
                      " "
                ],
                "expected": true,
                "hidden": false
          },
          {
                "args": [
                      "0P"
                ],
                "expected": false,
                "hidden": true
          },
          {
                "args": [
                      "ab_a"
                ],
                "expected": true,
                "hidden": true
          }
    ]
  },
  {
    id: 'q-str-4',
    title: 'Group Anagrams',
    topic: 'Strings',
    difficulty: 'Medium',
    description: 'Given an array of strings strs, group the anagrams together. You can return the answer in any order.',
    examples: [
      { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }
    ],
    constraints: ['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100'],
    solutionApproach: 'Use a hash map where the key is the sorted string (or a character count tuple) and the value is a list of matching words. Time complexity: O(n * k log k) where k is the max string length.'
  },

  // --- 3. LINKED LISTS ---
  {
    id: 'q-ll-1',
    title: 'Reverse Linked List',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    examples: [
      { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' },
      { input: 'head = [1,2]', output: '[2,1]' }
    ],
    constraints: ['The number of nodes in the list is the range [0, 5000].', '-5000 <= Node.val <= 5000'],
    solutionApproach: 'Iterate with three pointers: prev, current, and next. In each step, save current.next, point current.next to prev, advance prev to current, and current to next. O(n) time, O(1) space.'
  },
  {
    id: 'q-ll-2',
    title: 'Merge Two Sorted Lists',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    description: 'You are given the heads of two sorted linked lists list1 and list2. Merge the two lists into one sorted list by splicing together the nodes of the first two lists.',
    examples: [
      { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' }
    ],
    constraints: ['The number of nodes in both lists is in the range [0, 50].', '-100 <= Node.val <= 100'],
    solutionApproach: 'Create a dummy head node. While both lists are non-empty, attach the smaller node to current.next and advance that list. Append remaining nodes at the end. O(n + m) time, O(1) space.'
  },
  {
    id: 'q-ll-3',
    title: 'Linked List Cycle',
    topic: 'Linked Lists',
    difficulty: 'Easy',
    description: 'Given head, the head of a linked list, determine if the linked list has a cycle in it.',
    examples: [
      { input: 'head = [3,2,0,-4], pos = 1', output: 'true' },
      { input: 'head = [1], pos = -1', output: 'false' }
    ],
    constraints: ['The number of nodes in the list is in the range [0, 10^4].'],
    solutionApproach: "Floyd's Tortoise and Hare algorithm. Use two pointers: slow moves by 1 node, fast moves by 2 nodes. If they ever point to the same node, a cycle exists. O(n) time, O(1) auxiliary space."
  },
  {
    id: 'q-ll-4',
    title: 'Remove Nth Node From End of List',
    topic: 'Linked Lists',
    difficulty: 'Medium',
    description: 'Given the head of a linked list, remove the nth node from the end of the list and return its head.',
    examples: [
      { input: 'head = [1,2,3,4,5], n = 2', output: '[1,2,3,5]' }
    ],
    constraints: ['The number of nodes in the list is sz.', '1 <= sz <= 30', '1 <= n <= sz'],
    solutionApproach: 'Advance a fast pointer n steps ahead from a dummy node. Then advance both slow and fast together until fast reaches the end. slow.next is the node to delete. O(n) one-pass time.'
  },

  // --- 4. STACK ---
  {
    id: 'q-stk-1',
    title: 'Valid Parentheses',
    topic: 'Stack',
    difficulty: 'Easy',
    description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' }
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only ()[]{}.'],
    solutionApproach: 'Push opening brackets onto a stack. When encountering a closing bracket, pop the top of the stack and check if it matches the corresponding opening bracket. Stack must be empty at the end.',
    functionName: "isValid",
    starterCode: "/**\n * @param {string} s\n * @return {boolean}\n */\nfunction isValid(s) {\n  // Write your code here\n}",
    compare: "exact",
    testCases: [
          {
                "args": [
                      "()"
                ],
                "expected": true,
                "hidden": false
          },
          {
                "args": [
                      "()[]{}"
                ],
                "expected": true,
                "hidden": false
          },
          {
                "args": [
                      "(]"
                ],
                "expected": false,
                "hidden": false
          },
          {
                "args": [
                      "([)]"
                ],
                "expected": false,
                "hidden": true
          },
          {
                "args": [
                      "{[]}"
                ],
                "expected": true,
                "hidden": true
          },
          {
                "args": [
                      "["
                ],
                "expected": false,
                "hidden": true
          }
    ]
  },
  {
    id: 'q-stk-2',
    title: 'Min Stack',
    topic: 'Stack',
    difficulty: 'Medium',
    description: 'Design a stack that supports push, pop, top, and retrieving the minimum element in constant time O(1).',
    examples: [
      { input: '["MinStack","push","push","push","getMin","pop","top","getMin"] [[],[-2],[0],[-3],[],[],[],[]]', output: '[null,null,null,null,-3,null,0,-2]' }
    ],
    constraints: ['-2^31 <= val <= 2^31 - 1', 'Operations push, pop, top, getMin always called on non-empty stacks.'],
    solutionApproach: 'Maintain a secondary stack (minStack) alongside the primary stack. When pushing, also push min(val, minStack.top()) onto minStack. When popping, pop from both stacks.'
  },
  {
    id: 'q-stk-3',
    title: 'Daily Temperatures',
    topic: 'Stack',
    difficulty: 'Medium',
    description: 'Given an array of integers temperatures represents the daily temperatures, return an array answer such that answer[i] is the number of days you have to wait after the ith day to get a warmer temperature.',
    examples: [
      { input: 'temperatures = [73,74,75,71,69,72,76,73]', output: '[1,1,4,2,1,1,0,0]' }
    ],
    constraints: ['1 <= temperatures.length <= 10^5', '30 <= temperatures[i] <= 100'],
    solutionApproach: 'Use a monotonic decreasing stack storing indices. When a warmer day is found, pop previous colder indices and calculate the day difference. Runs in linear O(n) time.'
  },
  {
    id: 'q-stk-4',
    title: 'Evaluate Reverse Polish Notation',
    topic: 'Stack',
    difficulty: 'Medium',
    description: 'Evaluate the value of an arithmetic expression in Reverse Polish Notation. Valid operators are +, -, *, and /.',
    examples: [
      { input: 'tokens = ["2","1","+","3","*"]', output: '9' },
      { input: 'tokens = ["4","13","5","/","+"]', output: '6' }
    ],
    constraints: ['1 <= tokens.length <= 10^4', 'tokens[i] is either an operator or an integer.'],
    solutionApproach: 'Iterate through tokens. If token is an integer, push it to stack. If operator, pop two operands, apply the operation (b op a), and push result back. The final stack top is the answer.'
  },

  // --- 5. QUEUE ---
  {
    id: 'q-que-1',
    title: 'Implement Queue using Stacks',
    topic: 'Queue',
    difficulty: 'Easy',
    description: 'Implement a first in first out (FIFO) queue using only two stacks. The implemented queue should support push, pop, peek, and empty operations.',
    examples: [
      { input: '["MyQueue", "push", "push", "peek", "pop", "empty"] [[], [1], [2], [], [], []]', output: '[null, null, null, 1, 1, false]' }
    ],
    constraints: ['1 <= x <= 9', 'At most 100 calls made to push, pop, peek, and empty.'],
    solutionApproach: 'Use inputStack for push. For pop and peek, if outputStack is empty, transfer all elements from inputStack to outputStack. This achieves amortized O(1) operations.'
  },
  {
    id: 'q-que-2',
    title: 'Number of Recent Calls',
    topic: 'Queue',
    difficulty: 'Easy',
    description: 'You have a RecentCounter class which counts the number of recent requests within a certain time frame [t - 3000, t].',
    examples: [
      { input: '["RecentCounter", "ping", "ping", "ping", "ping"] [[], [1], [100], [3001], [3002]]', output: '[null, 1, 2, 3, 3]' }
    ],
    constraints: ['1 <= t <= 10^9', 'Each test case will call ping with strictly increasing values of t.'],
    solutionApproach: 'Push timestamp t into a queue. While queue.peek() < t - 3000, pop from the queue. Return queue.length. Runs in O(1) amortized time per ping.'
  },
  {
    id: 'q-que-3',
    title: 'Sliding Window Maximum',
    topic: 'Queue',
    difficulty: 'Hard',
    description: 'You are given an array of integers nums, there is a sliding window of size k which is moving from the very left of the array to the very right. Return the max sliding window.',
    examples: [
      { input: 'nums = [1,3,-1,-3,5,3,6,7], k = 3', output: '[3,3,5,5,6,7]' }
    ],
    constraints: ['1 <= nums.length <= 10^5', '1 <= k <= nums.length'],
    solutionApproach: 'Use a monotonic deque storing indices in decreasing order of element values. Remove indices outside the window from the front, and elements smaller than nums[i] from the back. O(n) time.'
  },
  {
    id: 'q-que-4',
    title: 'Design Circular Queue',
    topic: 'Queue',
    difficulty: 'Medium',
    description: 'Design your implementation of the circular queue. The circular queue is a linear data structure in which the operations are performed based on FIFO principle and the last position is connected back to the first position.',
    examples: [
      { input: '["MyCircularQueue", "enQueue", "enQueue", "enQueue", "enQueue", "Rear", "isFull"] [[3], [1], [2], [3], [4], [], []]', output: '[null, true, true, true, false, 3, true]' }
    ],
    constraints: ['0 <= value <= 1000', '1 <= k <= 1000'],
    solutionApproach: 'Use a fixed-size array with head and tail pointers and modulo arithmetic: (index + 1) % capacity. Track current size or count to distinguish full vs empty states in O(1) time.'
  },

  // --- 6. TREES ---
  {
    id: 'q-tree-1',
    title: 'Binary Tree Inorder Traversal',
    topic: 'Trees',
    difficulty: 'Easy',
    description: 'Given the root of a binary tree, return the inorder traversal of its nodes values.',
    examples: [
      { input: 'root = [1,null,2,3]', output: '[1,3,2]' },
      { input: 'root = []', output: '[]' }
    ],
    constraints: ['The number of nodes in the tree is in the range [0, 100].', '-100 <= Node.val <= 100'],
    solutionApproach: 'Recursive approach: traverse left subtree, visit root, traverse right subtree. Iterative approach uses a stack to simulate the call stack. O(n) time, O(n) space.'
  },
  {
    id: 'q-tree-2',
    title: 'Maximum Depth of Binary Tree',
    topic: 'Trees',
    difficulty: 'Easy',
    description: "Given the root of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
    examples: [
      { input: 'root = [3,9,20,null,null,15,7]', output: '3' }
    ],
    constraints: ['The number of nodes in the tree is in the range [0, 10^4].'],
    solutionApproach: 'Depth-first search: return 1 + max(maxDepth(root.left), maxDepth(root.right)). Base case: if root is null, return 0. O(n) time.'
  },
  {
    id: 'q-tree-3',
    title: 'Invert Binary Tree',
    topic: 'Trees',
    difficulty: 'Easy',
    description: 'Given the root of a binary tree, invert the tree, and return its root.',
    examples: [
      { input: 'root = [4,2,7,1,3,6,9]', output: '[4,7,2,9,6,3,1]' }
    ],
    constraints: ['The number of nodes in the tree is in the range [0, 100].'],
    solutionApproach: 'Swap left and right children recursively for every node in the tree. Base case: return if root is null. O(n) time.'
  },
  {
    id: 'q-tree-4',
    title: 'Lowest Common Ancestor of a BST',
    topic: 'Trees',
    difficulty: 'Medium',
    description: 'Given a binary search tree (BST), find the lowest common ancestor (LCA) node of two given nodes in the BST.',
    examples: [
      { input: 'root = [6,2,8,0,4,7,9,null,null,3,5], p = 2, q = 8', output: '6' }
    ],
    constraints: ['All Node.val are unique.', 'p and q will exist in the BST.'],
    solutionApproach: 'Leverage BST property: if both p and q are smaller than root, traverse left. If both are larger, traverse right. The split point where p and q diverge is the LCA. O(h) time.'
  },

  // --- 7. GRAPHS ---
  {
    id: 'q-grp-1',
    title: 'Number of Islands',
    topic: 'Graphs',
    difficulty: 'Medium',
    description: "Given an m x n 2D binary grid grid which represents a map of '1's (land) and '0's (water), return the number of islands. An island is surrounded by water and formed by connecting adjacent lands horizontally or vertically.",
    examples: [
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: '3' }
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300'],
    solutionApproach: "Iterate through each cell. When a '1' is encountered, increment island count and initiate a DFS/BFS to sink all connected land cells by marking them '0'. Runs in O(m * n) time."
  },
  {
    id: 'q-grp-2',
    title: 'Clone Graph',
    topic: 'Graphs',
    difficulty: 'Medium',
    description: 'Given a reference of a node in a connected undirected graph. Return a deep copy (clone) of the graph.',
    examples: [
      { input: 'adjList = [[2,4],[1,3],[2,4],[1,3]]', output: '[[2,4],[1,3],[2,4],[1,3]]' }
    ],
    constraints: ['The number of nodes in the graph is in the range [0, 100].'],
    solutionApproach: 'Use a hash map to map original nodes to their cloned counterparts. Perform DFS or BFS to visit each neighbor, cloning nodes as needed and copying adjacency relationships. O(V + E) time.'
  },
  {
    id: 'q-grp-3',
    title: 'Course Schedule',
    topic: 'Graphs',
    difficulty: 'Medium',
    description: 'There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [a, b] indicates that you must take b before a. Return true if you can finish all courses.',
    examples: [
      { input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true' },
      { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false' }
    ],
    constraints: ['1 <= numCourses <= 2000', '0 <= prerequisites.length <= 5000'],
    solutionApproach: "Detect cycle in a directed graph using Topological Sort (Kahn's Algorithm with in-degrees) or DFS with visited states (0=unvisited, 1=visiting, 2=visited). O(V + E) time."
  },
  {
    id: 'q-grp-4',
    title: 'Graph Valid Tree',
    topic: 'Graphs',
    difficulty: 'Medium',
    description: 'Given n nodes labeled from 0 to n - 1 and a list of undirected edges, write a function to check whether these edges make up a valid tree.',
    examples: [
      { input: 'n = 5, edges = [[0,1],[0,2],[0,3],[1,4]]', output: 'true' },
      { input: 'n = 5, edges = [[0,1],[1,2],[2,3],[1,3],[1,4]]', output: 'false' }
    ],
    constraints: ['1 <= n <= 2000', '0 <= edges.length <= 5000'],
    solutionApproach: 'A valid undirected tree of n nodes must have exactly n - 1 edges and no cycles (fully connected). Use Disjoint Set Union (Union-Find) or BFS to detect cycles and verify connectivity in O(E * alpha(V)).'
  },

  // --- 8. DYNAMIC PROGRAMMING ---
  {
    id: 'q-dp-1',
    title: 'Climbing Stairs',
    topic: 'Dynamic Programming',
    difficulty: 'Easy',
    description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
    examples: [
      { input: 'n = 2', output: '2' },
      { input: 'n = 3', output: '3' }
    ],
    constraints: ['1 <= n <= 45'],
    solutionApproach: 'Recognize the Fibonacci recurrence: ways(n) = ways(n-1) + ways(n-2). Optimize space by storing only the previous two values instead of a full array. Runs in O(n) time and O(1) space.',
    functionName: "climbStairs",
    starterCode: "/**\n * @param {number} n\n * @return {number}\n */\nfunction climbStairs(n) {\n  // Write your code here\n}",
    compare: "exact",
    testCases: [
          {
                "args": [
                      2
                ],
                "expected": 2,
                "hidden": false
          },
          {
                "args": [
                      3
                ],
                "expected": 3,
                "hidden": false
          },
          {
                "args": [
                      1
                ],
                "expected": 1,
                "hidden": false
          },
          {
                "args": [
                      4
                ],
                "expected": 5,
                "hidden": true
          },
          {
                "args": [
                      5
                ],
                "expected": 8,
                "hidden": true
          },
          {
                "args": [
                      6
                ],
                "expected": 13,
                "hidden": true
          }
    ]
  },
  {
    id: 'q-dp-2',
    title: 'Coin Change',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    description: 'You are given an integer array coins representing coins of different denominations and an integer amount. Return the fewest number of coins that you need to make up that amount.',
    examples: [
      { input: 'coins = [1,2,5], amount = 11', output: '3 (5 + 5 + 1)' },
      { input: 'coins = [2], amount = 3', output: '-1' }
    ],
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    solutionApproach: 'Bottom-up DP. Create array dp where dp[i] is the minimum coins for amount i, initialized to infinity. For each amount i from 1 to amount, dp[i] = min(dp[i], dp[i - coin] + 1). O(amount * coins.length) time.',
    functionName: "coinChange",
    starterCode: "/**\n * @param {number[]} coins\n * @param {number} amount\n * @return {number}\n */\nfunction coinChange(coins, amount) {\n  // Write your code here\n}",
    compare: "exact",
    testCases: [
          {
                "args": [
                      [
                            1,
                            2,
                            5
                      ],
                      11
                ],
                "expected": 3,
                "hidden": false
          },
          {
                "args": [
                      [
                            2
                      ],
                      3
                ],
                "expected": -1,
                "hidden": false
          },
          {
                "args": [
                      [
                            1
                      ],
                      0
                ],
                "expected": 0,
                "hidden": false
          },
          {
                "args": [
                      [
                            1
                      ],
                      2
                ],
                "expected": 2,
                "hidden": true
          },
          {
                "args": [
                      [
                            2,
                            5,
                            10,
                            1
                      ],
                      27
                ],
                "expected": 4,
                "hidden": true
          }
    ]
  },
  {
    id: 'q-dp-3',
    title: 'Longest Increasing Subsequence',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    description: 'Given an integer array nums, return the length of the longest strictly increasing subsequence.',
    examples: [
      { input: 'nums = [10,9,2,5,3,7,101,18]', output: '4' }
    ],
    constraints: ['1 <= nums.length <= 2500', '-10^4 <= nums[i] <= 10^4'],
    solutionApproach: 'Maintain array tails where tails[i] stores the smallest tail of all increasing subsequences of length i + 1. For each x, use binary search to find insertion position. Runs in O(n log n) time.'
  },
  {
    id: 'q-dp-4',
    title: 'House Robber',
    topic: 'Dynamic Programming',
    difficulty: 'Medium',
    description: 'You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you is that adjacent houses have security systems connected.',
    examples: [
      { input: 'nums = [1,2,3,1]', output: '4' },
      { input: 'nums = [2,7,9,3,1]', output: '12' }
    ],
    constraints: ['1 <= nums.length <= 100', '0 <= nums[i] <= 400'],
    solutionApproach: 'At each house i, rob = max(rob_prev, not_rob_prev + nums[i]). Space-optimize using two variables (prev1, prev2) representing max loot up to the last two houses. O(n) time, O(1) space.',
    functionName: "rob",
    starterCode: "/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction rob(nums) {\n  // Write your code here\n}",
    compare: "exact",
    testCases: [
          {
                "args": [
                      [
                            1,
                            2,
                            3,
                            1
                      ]
                ],
                "expected": 4,
                "hidden": false
          },
          {
                "args": [
                      [
                            2,
                            7,
                            9,
                            3,
                            1
                      ]
                ],
                "expected": 12,
                "hidden": false
          },
          {
                "args": [
                      [
                            2,
                            1,
                            1,
                            2
                      ]
                ],
                "expected": 4,
                "hidden": false
          },
          {
                "args": [
                      [
                            0
                      ]
                ],
                "expected": 0,
                "hidden": true
          },
          {
                "args": [
                      [
                            5,
                            1,
                            2,
                            10
                      ]
                ],
                "expected": 15,
                "hidden": true
          }
    ]
  },

  // --- 9. BINARY SEARCH ---
  {
    id: 'q-bs-1',
    title: 'Binary Search',
    topic: 'Binary Search',
    difficulty: 'Easy',
    description: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.',
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' }
    ],
    constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4', 'All elements are unique and sorted.'],
    solutionApproach: 'Initialize left = 0, right = nums.length - 1. While left <= right, compute mid = left + floor((right - left) / 2). If nums[mid] === target return mid; narrow bounds accordingly. O(log n) time.',
    functionName: "search",
    starterCode: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nfunction search(nums, target) {\n  // Write your code here\n}",
    compare: "exact",
    testCases: [
          {
                "args": [
                      [
                            -1,
                            0,
                            3,
                            5,
                            9,
                            12
                      ],
                      9
                ],
                "expected": 4,
                "hidden": false
          },
          {
                "args": [
                      [
                            -1,
                            0,
                            3,
                            5,
                            9,
                            12
                      ],
                      2
                ],
                "expected": -1,
                "hidden": false
          },
          {
                "args": [
                      [
                            5
                      ],
                      5
                ],
                "expected": 0,
                "hidden": false
          },
          {
                "args": [
                      [
                            2,
                            5
                      ],
                      5
                ],
                "expected": 1,
                "hidden": true
          },
          {
                "args": [
                      [
                            -5,
                            -3,
                            0,
                            2,
                            8,
                            11
                      ],
                      -3
                ],
                "expected": 1,
                "hidden": true
          }
    ]
  },
  {
    id: 'q-bs-2',
    title: 'Search in Rotated Sorted Array',
    topic: 'Binary Search',
    difficulty: 'Medium',
    description: 'There is an integer array nums sorted in ascending order (with distinct values), possibly rotated at an unknown pivot index. Given target, return the index if target is in nums, or -1.',
    examples: [
      { input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4' },
      { input: 'nums = [4,5,6,7,0,1,2], target = 3', output: '-1' }
    ],
    constraints: ['1 <= nums.length <= 5000', '-10^4 <= nums[i] <= 10^4'],
    solutionApproach: 'At least one half of the rotated array is always sorted. Determine which half is sorted by comparing nums[left] and nums[mid], then check if target lies within that sorted range. O(log n) time.',
    functionName: "search",
    starterCode: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number}\n */\nfunction search(nums, target) {\n  // Write your code here\n}",
    compare: "exact",
    testCases: [
          {
                "args": [
                      [
                            4,
                            5,
                            6,
                            7,
                            0,
                            1,
                            2
                      ],
                      0
                ],
                "expected": 4,
                "hidden": false
          },
          {
                "args": [
                      [
                            4,
                            5,
                            6,
                            7,
                            0,
                            1,
                            2
                      ],
                      3
                ],
                "expected": -1,
                "hidden": false
          },
          {
                "args": [
                      [
                            1
                      ],
                      0
                ],
                "expected": -1,
                "hidden": false
          },
          {
                "args": [
                      [
                            1,
                            3
                      ],
                      3
                ],
                "expected": 1,
                "hidden": true
          },
          {
                "args": [
                      [
                            5,
                            1,
                            3
                      ],
                      5
                ],
                "expected": 0,
                "hidden": true
          }
    ]
  },
  {
    id: 'q-bs-3',
    title: 'Find Minimum in Rotated Sorted Array',
    topic: 'Binary Search',
    difficulty: 'Medium',
    description: 'Given the sorted rotated array nums of unique elements, return the minimum element of this array.',
    examples: [
      { input: 'nums = [3,4,5,1,2]', output: '1' },
      { input: 'nums = [4,5,6,7,0,1,2]', output: '0' }
    ],
    constraints: ['n == nums.length', '1 <= n <= 5000', '-5000 <= nums[i] <= 5000'],
    solutionApproach: 'Compare nums[mid] with nums[right]. If nums[mid] > nums[right], the minimum is in the right half (left = mid + 1). Otherwise, it is in the left half including mid (right = mid). O(log n) time.',
    functionName: "findMin",
    starterCode: "/**\n * @param {number[]} nums\n * @return {number}\n */\nfunction findMin(nums) {\n  // Write your code here\n}",
    compare: "exact",
    testCases: [
          {
                "args": [
                      [
                            3,
                            4,
                            5,
                            1,
                            2
                      ]
                ],
                "expected": 1,
                "hidden": false
          },
          {
                "args": [
                      [
                            4,
                            5,
                            6,
                            7,
                            0,
                            1,
                            2
                      ]
                ],
                "expected": 0,
                "hidden": false
          },
          {
                "args": [
                      [
                            11,
                            13,
                            15,
                            17
                      ]
                ],
                "expected": 11,
                "hidden": false
          },
          {
                "args": [
                      [
                            2,
                            1
                      ]
                ],
                "expected": 1,
                "hidden": true
          },
          {
                "args": [
                      [
                            3,
                            1,
                            2
                      ]
                ],
                "expected": 1,
                "hidden": true
          }
    ]
  },
  {
    id: 'q-bs-4',
    title: 'Search a 2D Matrix',
    topic: 'Binary Search',
    difficulty: 'Medium',
    description: 'You are given an m x n integer matrix matrix with the following two properties: Each row is sorted in non-decreasing order, and the first integer of each row is greater than the last integer of the previous row. Given target, return true if target is in matrix.',
    examples: [
      { input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3', output: 'true' }
    ],
    constraints: ['m == matrix.length', 'n == matrix[i].length', '1 <= m, n <= 100'],
    solutionApproach: 'Treat the 2D matrix as a virtual 1D sorted array of length m * n. For index mid, row = floor(mid / n) and col = mid % n. Perform standard binary search in O(log(m * n)) time.'
  }
];

async function seed() {
  console.log('--- Starting DevPrep Database Seeding ---');

  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@devprep.com').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@1234';
  const demoEmail = 'demo@devprep.com';
  const demoPassword = 'Demo@1234';

  if (adminPassword === 'Admin@1234' || demoPassword === 'Demo@1234') {
    console.warn('\n⚠️  [seed] WARNING: Using default development credentials ("Admin@1234" / "Demo@1234").');
    console.warn('    Set ADMIN_PASSWORD in server/.env and change passwords before deploying to production!\n');
  }

  console.log('Hashing default account passwords with bcrypt...');
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);
  const demoPasswordHash = await bcrypt.hash(demoPassword, 10);

  const adminId = 'user-admin-default';
  const demoId = 'user-demo-default';

  // 1. Seed Users (idempotent: preserve existing records)
  const existingUsers = await readJson(FILES.USERS, []);
  const users = [...existingUsers];

  if (!users.some((u) => u.id === adminId || u.email === adminEmail)) {
    users.push({
      id: adminId,
      name: 'DevPrep Admin',
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
  }

  if (!users.some((u) => u.id === demoId || u.email === demoEmail)) {
    users.push({
      id: demoId,
      name: 'Demo Student',
      email: demoEmail,
      passwordHash: demoPasswordHash,
      role: 'user',
      createdAt: new Date().toISOString()
    });
  }

  await writeJson(FILES.USERS, users);
  console.log(`✓ Seeded users into "${FILES.USERS}" (total users: ${users.length}).`);

  // 2. Seed 36 DSA Questions
  await writeJson(FILES.QUESTIONS, QUESTIONS_DATA);
  console.log(`✓ Seeded ${QUESTIONS_DATA.length} DSA questions into "${FILES.QUESTIONS}".`);

  // 3. Seed Demo User Solved Questions & Active Streak
  const demoSolvedQuestionIds = [
    'q-arr-1', // Two Sum
    'q-arr-2', // Best Time to Buy and Sell Stock
    'q-str-1', // Valid Anagram
    'q-ll-1',  // Reverse Linked List
    'q-stk-1', // Valid Parentheses
    'q-tree-1',// Binary Tree Inorder Traversal
    'q-dp-1',  // Climbing Stairs
    'q-bs-1'   // Binary Search
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const existingProgress = await readJson(FILES.PROGRESS, {});
  const progress = { ...existingProgress };

  if (!progress[adminId]) {
    progress[adminId] = {
      solvedQuestionIds: [],
      streak: { current: 0, lastActiveDate: null },
      activity: [
        {
          type: 'account_created',
          text: 'Admin account provisioned',
          date: new Date().toISOString()
        }
      ],
      profile: {
        skills: ['JavaScript', 'Node.js', 'System Architecture'],
        goals: ['Manage platform content'],
        theme: 'light'
      }
    };
  }

  if (!progress[demoId]) {
    progress[demoId] = {
      solvedQuestionIds: demoSolvedQuestionIds,
      streak: {
        current: 3,
        lastActiveDate: todayStr
      },
      activity: [
        {
          type: 'solved',
          text: 'Solved Two Sum',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'solved',
          text: 'Solved Valid Parentheses',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          type: 'solved',
          text: 'Solved Climbing Stairs',
          date: new Date().toISOString()
        }
      ],
      profile: {
        skills: ['JavaScript', 'React', 'DSA'],
        goals: ['Crack SDE Internship 2026'],
        theme: 'light'
      }
    };
  }

  await writeJson(FILES.PROGRESS, progress);
  console.log(`✓ Seeded user progress into "${FILES.PROGRESS}".`);

  // 4. Seed Demo Solution (idempotent)
  const existingSolutions = await readJson(FILES.SOLUTIONS, []);
  const solutions = [...existingSolutions];
  const demoSolution = {
    id: 'sol-demo-1',
    userId: demoId,
    questionId: 'q-arr-1',
    language: 'JavaScript',
    code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    updatedAt: new Date().toISOString()
  };

  if (!solutions.some((s) => s.id === demoSolution.id)) {
    solutions.push(demoSolution);
  }
  await writeJson(FILES.SOLUTIONS, solutions);
  console.log(`✓ Seeded sample solutions into "${FILES.SOLUTIONS}" (total solutions: ${solutions.length}).`);

  // 5. Seed Demo Applications (idempotent)
  const existingApps = await readJson(FILES.APPLICATIONS, []);
  const applications = [...existingApps];
  const demoApplications = [
    {
      id: 'app-demo-1',
      userId: demoId,
      company: 'Google',
      role: 'SDE Intern',
      location: 'Bangalore',
      appliedDate: '2026-10-05',
      status: 'Interview',
      notes: 'Round 1 technical interview scheduled on DSA and Problem Solving.'
    },
    {
      id: 'app-demo-2',
      userId: demoId,
      company: 'Microsoft',
      role: 'Software Engineer',
      location: 'Hyderabad',
      appliedDate: '2026-10-12',
      status: 'Applied',
      notes: 'Applied via employee referral from college alumni network.'
    },
    {
      id: 'app-demo-3',
      userId: demoId,
      company: 'Amazon',
      role: 'SDE 1',
      location: 'Bangalore',
      appliedDate: '2026-09-28',
      status: 'Selected',
      notes: 'Received offer letter! 6-month internship + full-time conversion.'
    },
    {
      id: 'app-demo-4',
      userId: demoId,
      company: 'Uber',
      role: 'Backend Intern',
      location: 'Bangalore',
      appliedDate: '2026-10-02',
      status: 'Rejected',
      notes: 'Online assessment had tricky graph and dynamic programming questions.'
    },
    {
      id: 'app-demo-5',
      userId: demoId,
      company: 'Razorpay',
      role: 'Frontend Engineer',
      location: 'Remote',
      appliedDate: '2026-10-18',
      status: 'Interview',
      notes: 'Machine coding round in React completed; hiring manager round pending.'
    }
  ];

  for (const app of demoApplications) {
    if (!applications.some((a) => a.id === app.id)) {
      applications.push(app);
    }
  }
  await writeJson(FILES.APPLICATIONS, applications);
  console.log(`✓ Seeded sample applications into "${FILES.APPLICATIONS}" (total applications: ${applications.length}).`);

  // 6. Seed Mock Tests (Phase 8 Incremental: 45 MCQs across 9 topics & Demo Attempts)
  const MCQ_DATA = [
    // --- 1. ARRAYS ---
    {
      id: 'mcq-arr-1',
      topic: 'Arrays',
      question: 'What is the worst-case time complexity of inserting an element at the beginning of an array of size n?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctIndex: 2,
      explanation: 'Inserting at the beginning requires shifting all n existing elements right by one position, taking O(n) time.'
    },
    {
      id: 'mcq-arr-2',
      topic: 'Arrays',
      question: "In Kadane's algorithm for Maximum Subarray, what is the runtime complexity achieved?",
      options: ['O(n^2)', 'O(n)', 'O(log n)', 'O(1)'],
      correctIndex: 1,
      explanation: "Kadane's algorithm scans the array in a single pass maintaining current and maximum sums in O(n) time."
    },
    {
      id: 'mcq-arr-3',
      topic: 'Arrays',
      question: 'Given an array nums of n elements, what is the space complexity of finding duplicates using a Hash Set?',
      options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
      correctIndex: 1,
      explanation: 'In the worst case where all elements are unique, the hash set stores all n elements, consuming O(n) auxiliary space.'
    },
    {
      id: 'mcq-arr-4',
      topic: 'Arrays',
      question: 'Which of the following operations takes O(1) time in a static array?',
      options: ['Random access by index', 'Searching an unsorted array', 'Deleting the first element', 'Inserting into the middle'],
      correctIndex: 0,
      explanation: 'Direct memory calculation base_address + index * element_size allows O(1) random access by index.'
    },
    {
      id: 'mcq-arr-5',
      topic: 'Arrays',
      question: 'The Dutch National Flag problem (sort 0s, 1s, and 2s) can be solved in a single pass with what complexity?',
      options: ['O(n) time, O(1) space', 'O(n log n) time, O(n) space', 'O(n^2) time, O(1) space', 'O(log n) time, O(1) space'],
      correctIndex: 0,
      explanation: 'Using three pointers (low, mid, high), the Dutch National Flag algorithm partitions in O(n) time and O(1) extra space.'
    },

    // --- 2. STRINGS ---
    {
      id: 'mcq-str-1',
      topic: 'Strings',
      question: 'What is the time complexity of checking if two strings of length n are anagrams using character frequency counting?',
      options: ['O(n^2)', 'O(n)', 'O(n log n)', 'O(1)'],
      correctIndex: 1,
      explanation: 'Counting frequencies takes O(n) time to scan both strings and O(26) = O(1) auxiliary space.'
    },
    {
      id: 'mcq-str-2',
      topic: 'Strings',
      question: 'In the KMP pattern searching algorithm, what is the worst-case time complexity to search a pattern of length m in text of length n?',
      options: ['O(n * m)', 'O(n + m)', 'O(n log m)', 'O(m log n)'],
      correctIndex: 1,
      explanation: 'KMP builds the prefix table (LPS) in O(m) and matches against the text in O(n), yielding total O(n + m) time.'
    },
    {
      id: 'mcq-str-3',
      topic: 'Strings',
      question: 'Which algorithmic technique allows finding the longest substring without repeating characters in O(n) time?',
      options: ['Dynamic programming with memoization', 'Two-pointer sliding window with hash set', 'Divide and conquer', 'Breadth-first search'],
      correctIndex: 1,
      explanation: 'A sliding window expands the right pointer and contracts the left pointer whenever duplicate characters are encountered.'
    },
    {
      id: 'mcq-str-4',
      topic: 'Strings',
      question: 'What is the space complexity of storing the longest palindromic substring in a string of length n?',
      options: ['O(1)', 'O(n)', 'O(n^2)', 'O(log n)'],
      correctIndex: 1,
      explanation: 'The resulting substring itself can be up to length n, requiring O(n) storage.'
    },
    {
      id: 'mcq-str-5',
      topic: 'Strings',
      question: 'Which string matching algorithm uses rolling hashes to search for a pattern in text?',
      options: ['Boyer-Moore', 'Rabin-Karp', 'Aho-Corasick', "Manacher's Algorithm"],
      correctIndex: 1,
      explanation: 'Rabin-Karp computes rolling hash values of substrings to find potential pattern matches in O(n + m) average time.'
    },

    // --- 3. LINKED LISTS ---
    {
      id: 'mcq-ll-1',
      topic: 'Linked Lists',
      question: 'How can you detect a cycle in a singly linked list in O(n) time and O(1) auxiliary space?',
      options: ["Floyd's Tortoise and Hare algorithm", 'Hash table storing visited pointers', 'Recursion stack', 'Sorting node memory addresses'],
      correctIndex: 0,
      explanation: "Floyd's algorithm moves slow by 1 step and fast by 2 steps; if a cycle exists, they must meet within the loop."
    },
    {
      id: 'mcq-ll-2',
      topic: 'Linked Lists',
      question: 'What is the time complexity to find the middle node of a linked list using slow and fast pointers?',
      options: ['O(n^2)', 'O(n)', 'O(log n)', 'O(1)'],
      correctIndex: 1,
      explanation: 'With slow advancing 1 step and fast advancing 2 steps, the middle node is found in a single pass of O(n) steps.'
    },
    {
      id: 'mcq-ll-3',
      topic: 'Linked Lists',
      question: 'In a doubly linked list with head and tail pointers, what is the time complexity to delete the last node?',
      options: ['O(n)', 'O(1)', 'O(log n)', 'O(n^2)'],
      correctIndex: 1,
      explanation: 'Since the tail has a direct backward pointer (tail.prev), unlinking the last node takes O(1) time.'
    },
    {
      id: 'mcq-ll-4',
      topic: 'Linked Lists',
      question: 'What is the time complexity to reverse a singly linked list iteratively?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
      correctIndex: 2,
      explanation: 'Iterating through the list once and reversing each next pointer takes O(n) time and O(1) space.'
    },
    {
      id: 'mcq-ll-5',
      topic: 'Linked Lists',
      question: 'What is a primary advantage of a linked list over a dynamic array?',
      options: ['Constant-time random access', 'Dynamic sizing and O(1) insertion/deletion at known nodes without shifting', 'Better cache locality', 'Lower memory overhead per element'],
      correctIndex: 1,
      explanation: 'Linked lists allocate nodes dynamically without needing pre-allocated memory or shifting elements during insertions.'
    },

    // --- 4. STACK ---
    {
      id: 'mcq-stk-1',
      topic: 'Stack',
      question: 'Which data structure principle does a Stack follow?',
      options: ['FIFO (First In First Out)', 'LIFO (Last In First Out)', 'Priority Based', 'Random Access'],
      correctIndex: 1,
      explanation: 'Stacks follow Last-In, First-Out (LIFO), where the most recently pushed element is the first to be popped.'
    },
    {
      id: 'mcq-stk-2',
      topic: 'Stack',
      question: 'What data structure is most suitable for evaluating postfix expressions and matching parentheses?',
      options: ['Queue', 'Stack', 'Binary Tree', 'Disjoint Set'],
      correctIndex: 1,
      explanation: 'A stack cleanly tracks opening brackets and operands, matching them with incoming closing brackets and operators.'
    },
    {
      id: 'mcq-stk-3',
      topic: 'Stack',
      question: 'What is the time complexity to find the Next Greater Element for all elements in an array using a Monotonic Stack?',
      options: ['O(n^2)', 'O(n log n)', 'O(n)', 'O(2^n)'],
      correctIndex: 2,
      explanation: 'Every element is pushed onto and popped from the monotonic stack at most once, resulting in linear O(n) time.'
    },
    {
      id: 'mcq-stk-4',
      topic: 'Stack',
      question: 'Can a queue be implemented using two stacks? If so, what is the amortized cost per dequeue operation?',
      options: ['No, impossible', 'Yes, O(1) amortized', 'Yes, O(n^2) amortized', 'Yes, O(log n) amortized'],
      correctIndex: 1,
      explanation: 'Using an inbox stack for enqueue and an outbox stack for dequeue gives amortized O(1) cost per dequeue.'
    },
    {
      id: 'mcq-stk-5',
      topic: 'Stack',
      question: 'In recursive function execution, what happens when recursion depth exceeds system capacity without hitting a base case?',
      options: ['Stack Overflow error', 'Garbage collection trigger', 'Automatic heap conversion', 'Buffer underrun'],
      correctIndex: 0,
      explanation: 'Each recursive call allocates a stack frame; infinite recursion exhausts call stack memory, triggering a Stack Overflow.'
    },

    // --- 5. QUEUE ---
    {
      id: 'mcq-que-1',
      topic: 'Queue',
      question: 'Which principle defines the ordering in a standard Queue?',
      options: ['LIFO', 'FIFO (First In First Out)', 'FILO', 'Random'],
      correctIndex: 1,
      explanation: 'A queue operates under First-In, First-Out (FIFO): elements are enqueued at the rear and dequeued from the front.'
    },
    {
      id: 'mcq-que-2',
      topic: 'Queue',
      question: 'What issue in a linear array queue implementation does a Circular Queue resolve?',
      options: ['Stack overflow', 'False overflow when front elements are dequeued', 'Hash collisions', 'Loss of LIFO order'],
      correctIndex: 1,
      explanation: 'In a plain array queue, dequeuing leaves unused space at the front; a circular queue wraps around using modulo arithmetic.'
    },
    {
      id: 'mcq-que-3',
      topic: 'Queue',
      question: 'In Breadth-First Search (BFS) graph traversal, which data structure is used to maintain the exploration frontier?',
      options: ['Stack', 'Queue', 'Max Heap', 'Binary Search Tree'],
      correctIndex: 1,
      explanation: 'BFS explores vertices level by level using a FIFO queue to guarantee shortest path traversal in unweighted graphs.'
    },
    {
      id: 'mcq-que-4',
      topic: 'Queue',
      question: 'What is a Deque (Double-Ended Queue)?',
      options: ['A queue that supports insertion and deletion at both ends', 'A queue with priority', 'A queue that only accepts duplicates', 'A queue implemented on disk'],
      correctIndex: 0,
      explanation: 'A deque supports constant-time push and pop operations at both the front and the back.'
    },
    {
      id: 'mcq-que-5',
      topic: 'Queue',
      question: 'What is the time complexity of inserting an element into a Priority Queue implemented with a binary min-heap?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctIndex: 1,
      explanation: 'Inserting at the end and bubbling up (heapify-up) along the tree height of log2(n) takes O(log n) time.'
    },

    // --- 6. TREES ---
    {
      id: 'mcq-tre-1',
      topic: 'Trees',
      question: 'In an unbalanced Binary Search Tree (BST) of n nodes, what is the worst-case time complexity of search?',
      options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
      correctIndex: 2,
      explanation: 'If a BST becomes skewed (like a linked list), searching requires inspecting every node, taking O(n) time.'
    },
    {
      id: 'mcq-tre-2',
      topic: 'Trees',
      question: 'Which tree traversal produces elements of a Binary Search Tree in sorted ascending order?',
      options: ['Pre-order', 'In-order', 'Post-order', 'Level-order'],
      correctIndex: 1,
      explanation: 'In-order traversal visits left subtree, root, then right subtree, naturally outputting keys in ascending order.'
    },
    {
      id: 'mcq-tre-3',
      topic: 'Trees',
      question: 'What is the maximum number of nodes at level L in a binary tree (assuming the root is at level 0)?',
      options: ['2^L', '2^(L+1) - 1', 'L^2', '2L'],
      correctIndex: 0,
      explanation: 'Level 0 has 2^0 = 1 node, level 1 has 2^1 = 2 nodes; in general, level L can hold at most 2^L nodes.'
    },
    {
      id: 'mcq-tre-4',
      topic: 'Trees',
      question: 'What self-balancing binary search tree ensures the height difference between left and right subtrees is at most 1?',
      options: ['Red-Black Tree', 'AVL Tree', 'B-Tree', 'Trie'],
      correctIndex: 1,
      explanation: 'An AVL tree maintains strict balance by enforcing a balance factor of -1, 0, or 1 at every node.'
    },
    {
      id: 'mcq-tre-5',
      topic: 'Trees',
      question: 'What is the lowest common ancestor (LCA) of nodes 2 and 8 in a BST with root 6?',
      options: ['6', '2', '8', '4'],
      correctIndex: 0,
      explanation: 'Since 2 is in the left subtree (2 < 6) and 8 is in the right subtree (8 > 6), the paths diverge at root 6, making 6 the LCA.'
    },

    // --- 7. GRAPHS ---
    {
      id: 'mcq-grp-1',
      topic: 'Graphs',
      question: 'What is the time complexity of Depth-First Search (DFS) on a graph represented as an adjacency list with V vertices and E edges?',
      options: ['O(V^2)', 'O(V + E)', 'O(V * E)', 'O(E log V)'],
      correctIndex: 1,
      explanation: 'DFS visits every vertex once and explores every edge in the adjacency list, yielding O(V + E) time.'
    },
    {
      id: 'mcq-grp-2',
      topic: 'Graphs',
      question: 'Which algorithm finds single-source shortest paths in a weighted graph with non-negative edge weights?',
      options: ['Bellman-Ford', "Dijkstra's Algorithm", 'Floyd-Warshall', "Kruskal's Algorithm"],
      correctIndex: 1,
      explanation: "Dijkstra's algorithm greedily extracts the minimum tentative distance using a priority queue in O((V + E) log V) time."
    },
    {
      id: 'mcq-grp-3',
      topic: 'Graphs',
      question: 'How can you find a topological ordering in a Directed Acyclic Graph (DAG)?',
      options: ["Kahn's Algorithm (in-degree queue) or DFS with stack", "Dijkstra's Algorithm", "Prim's Algorithm", 'Binary Search'],
      correctIndex: 0,
      explanation: "Topological ordering can be constructed using Kahn's algorithm (in-degree 0 queue) or post-order DFS."
    },
    {
      id: 'mcq-grp-4',
      topic: 'Graphs',
      question: 'What is a Minimum Spanning Tree (MST) of a connected, undirected, weighted graph with V vertices?',
      options: ['A cycle containing all vertices', 'A tree connecting all V vertices with V - 1 edges having minimal total weight', 'The shortest path between source and target', 'A graph with maximum flow'],
      correctIndex: 1,
      explanation: 'An MST connects all V vertices without cycles using exactly V - 1 edges that minimize the sum of edge weights.'
    },
    {
      id: 'mcq-grp-5',
      topic: 'Graphs',
      question: 'What is the space complexity of an adjacency matrix representation for a graph with V vertices?',
      options: ['O(V)', 'O(V + E)', 'O(V^2)', 'O(E)'],
      correctIndex: 2,
      explanation: 'An adjacency matrix allocates a 2D array of size V x V, taking O(V^2) memory regardless of the number of edges.'
    },

    // --- 8. DYNAMIC PROGRAMMING ---
    {
      id: 'mcq-dp-1',
      topic: 'Dynamic Programming',
      question: 'What are the two essential characteristics of a problem solvable by Dynamic Programming?',
      options: ['Greedy choice and divide and conquer', 'Overlapping subproblems and optimal substructure', 'Sorting and binary search', 'Adjacency matrix and visited array'],
      correctIndex: 1,
      explanation: 'DP applies when smaller instances of the problem overlap and the overall optimal solution can be built from optimal sub-solutions.'
    },
    {
      id: 'mcq-dp-2',
      topic: 'Dynamic Programming',
      question: 'What is the distinction between Memoization (Top-Down) and Tabulation (Bottom-Up)?',
      options: ['Memoization is iterative; Tabulation is recursive', 'Memoization is recursive with caching; Tabulation is iterative table filling', 'They solve completely different problem classes', 'Tabulation requires exponential space'],
      correctIndex: 1,
      explanation: 'Memoization caches results of recursive calls from top to base, while tabulation iteratively fills a table from base cases up.'
    },
    {
      id: 'mcq-dp-3',
      topic: 'Dynamic Programming',
      question: 'What is the time complexity to solve the 0/1 Knapsack problem with n items and capacity W using Dynamic Programming?',
      options: ['O(2^n)', 'O(n * W)', 'O(n + W)', 'O(n log W)'],
      correctIndex: 1,
      explanation: 'The DP table has dimensions (n + 1) x (W + 1), and each cell takes O(1) to evaluate, giving O(n * W) pseudo-polynomial time.'
    },
    {
      id: 'mcq-dp-4',
      topic: 'Dynamic Programming',
      question: 'In the Longest Common Subsequence (LCS) problem, what is the DP state transition when s1[i-1] == s2[j-1]?',
      options: ['dp[i][j] = dp[i-1][j-1] + 1', 'dp[i][j] = max(dp[i-1][j], dp[i][j-1])', 'dp[i][j] = dp[i-1][j] + dp[i][j-1]', 'dp[i][j] = 0'],
      correctIndex: 0,
      explanation: 'When characters match, 1 is added to the LCS length of the smaller prefixes: dp[i-1][j-1] + 1.'
    },
    {
      id: 'mcq-dp-5',
      topic: 'Dynamic Programming',
      question: 'In calculating the nth Fibonacci number, how does Dynamic Programming improve upon naive recursion?',
      options: ['Reduces time complexity from O(2^n) to O(n)', 'Increases floating point precision', 'Eliminates variables', 'Transforms the answer into floats'],
      correctIndex: 0,
      explanation: 'Naive recursion recomputes overlapping subproblems in O(2^n) time; DP stores results to evaluate each subproblem once in O(n) time.'
    },

    // --- 9. BINARY SEARCH ---
    {
      id: 'mcq-bs-1',
      topic: 'Binary Search',
      question: 'What precondition MUST be met before applying standard Binary Search on an array?',
      options: ['Array elements must be all positive', 'Array must be sorted', 'Array size must be a power of 2', 'Array must have no duplicates'],
      correctIndex: 1,
      explanation: 'Binary Search halves the search space by comparing with the midpoint, which requires elements to be in sorted order.'
    },
    {
      id: 'mcq-bs-2',
      topic: 'Binary Search',
      question: 'What is the maximum number of comparisons Binary Search makes on a sorted array of 1,000,000 items in the worst case?',
      options: ['~20 comparisons', '~100 comparisons', '~1000 comparisons', '~500,000 comparisons'],
      correctIndex: 0,
      explanation: 'log2(1,000,000) is approximately 19.93, meaning at most 20 comparisons are required to locate or rule out any key.'
    },
    {
      id: 'mcq-bs-3',
      topic: 'Binary Search',
      question: 'To avoid 32-bit integer overflow when calculating midpoint (low + high) / 2, which formula is recommended?',
      options: ['low + (high - low) / 2', '(high - low) / 2', 'low * 2', 'high - low'],
      correctIndex: 0,
      explanation: 'If low + high exceeds 2^31 - 1, it overflows; low + (high - low) / 2 prevents overflow while computing the exact midpoint.'
    },
    {
      id: 'mcq-bs-4',
      topic: 'Binary Search',
      question: 'Can Binary Search be used to find the minimum element in a rotated sorted array in O(log n) time?',
      options: ['Yes, by comparing nums[mid] with nums[right]', 'No, it always requires linear scan O(n)', 'Only if rotated an even number of times', 'Only if array contains negative numbers'],
      correctIndex: 0,
      explanation: 'Comparing nums[mid] with nums[right] determines whether the pivot lies in the left or right partition in O(log n) time.'
    },
    {
      id: 'mcq-bs-5',
      topic: 'Binary Search',
      question: "What is 'Binary Search on Answer'?",
      options: ['Searching a sorted array for an index', 'Searching monotonic solution spaces using a feasibility check function', 'Searching binary trees', 'Searching using 0s and 1s only'],
      correctIndex: 1,
      explanation: 'When a feasibility check is monotonic (true for all values >= target), binary search can find the optimal threshold in O(log(range) * check_cost).'
    }
  ];

  const demoAttempts = [
    {
      id: 'att-demo-1',
      userId: demoId,
      topic: 'Arrays',
      score: 4,
      total: 5,
      accuracy: 80,
      timeTaken: 145,
      date: new Date(Date.now() - 86400000 * 2).toISOString(),
      topicBreakdown: { Arrays: { score: 4, total: 5 } }
    },
    {
      id: 'att-demo-2',
      userId: demoId,
      topic: 'Trees',
      score: 5,
      total: 5,
      accuracy: 100,
      timeTaken: 190,
      date: new Date(Date.now() - 86400000).toISOString(),
      topicBreakdown: { Trees: { score: 5, total: 5 } }
    }
  ];

  // 6. Seed MCQ Question Bank (tracked)
  await writeJson(FILES.MCQ_BANK, MCQ_DATA);
  console.log(`✓ Seeded ${MCQ_DATA.length} MCQs into "${FILES.MCQ_BANK}".`);

  // 7. Seed Demo Mock Attempts (idempotent)
  const existingAttempts = await readJson(FILES.MOCK_ATTEMPTS, []);
  const attempts = [...existingAttempts];
  for (const att of demoAttempts) {
    if (!attempts.some((a) => a.id === att.id)) {
      attempts.push(att);
    }
  }
  await writeJson(FILES.MOCK_ATTEMPTS, attempts);
  console.log(`✓ Seeded sample mock test attempts into "${FILES.MOCK_ATTEMPTS}" (total attempts: ${attempts.length}).`);

  console.log('\n=========================================');
  console.log('DATABASE SEEDING COMPLETED SUCCESSFULLY! ✓');
  console.log('=========================================');
}

seed().catch((err) => {
  console.error('\n❌ Seeding failed:', err);
  process.exit(1);
});
