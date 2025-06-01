const sampleBooks = [
  // Jan 2025 (4 books)
  { title: "Book 1", dateRead: "2025-01-05", pages: 100, myRating: 4, author: "Author A" },
  { title: "Book 2", dateRead: "2025-01-15", pages: 120, myRating: 5, author: "Author B" },
  { title: "Book 3", dateRead: "2025-01-20", pages: 80, myRating: 3, author: "Author A" },
  { title: "Book 4", dateRead: "2025-01-25", pages: 150, myRating: 4, author: "Author C" },
  // Feb 2025 (3 books)
  { title: "Book 5", dateRead: "2025-02-05", pages: 110, myRating: 4, author: "Author B" },
  { title: "Book 6", dateRead: "2025-02-15", pages: 90, myRating: 3, author: "Author D" },
  { title: "Book 7", dateRead: "2025-02-20", pages: 130, myRating: 5, author: "Author A" },
  // Mar 2025 (3 books)
  { title: "Book 8", dateRead: "2025-03-05", pages: 100, myRating: 4, author: "Author C" },
  { title: "Book 9", dateRead: "2025-03-15", pages: 120, myRating: 5, author: "Author B" },
  { title: "Book 10", dateRead: "2025-03-20", pages: 80, myRating: 3, author: "Author D" },
  // Apr 2025 (3 books) - for pages/day, assuming "today" is May 15, 2025
  { title: "Book 11", dateRead: "2025-04-20", pages: 150, myRating: 4, author: "Author A" }, // Recent
  { title: "Book 12", dateRead: "2025-04-25", pages: 110, myRating: 4, author: "Author C" }, // Recent
  { title: "Book 13", dateRead: "2025-04-28", pages: 90, myRating: 3, author: "Author B" },  // Recent
  // May 2025 (3 books) - for pages/day
  { title: "Book 14", dateRead: "2025-05-01", pages: 130, myRating: 5, author: "Author D" }, // Recent
  { title: "Book 15", dateRead: "2025-05-05", pages: 100, myRating: 4, author: "Author A" }, // Recent
  { title: "Book 16", dateRead: "2025-05-10", pages: 120, myRating: 5, author: "Author C" }  // Recent
];
// Expected recent pages: (150+110+90) + (130+100+120) = 350 + 350 = 700. Expected pages/day: 700/30 = 23.33

let currentReadingData = [];
let currentStats = {};
let currentGoalProgress = {};
const mockSetReadingData = (data) => { console.log("Mock setReadingData called with (length):", data.length); currentReadingData = data; };
const mockSetStats = (stats) => { console.log("Mock setStats called with (totalBooks):", stats.totalBooks, "(pagesPerDay):", stats.readingPace?.pagesPerDay); currentStats = stats; };
const mockSetGoalProgress = (gp) => { console.log("Mock setGoalProgress called with (yearly current):", gp.yearly?.current); currentGoalProgress = gp; };
const mockSetLoading = (loading) => { /* console.log("Mock setLoading called with:", loading); */ };
const mockSetError = (err) => { console.log("Mock setError called with:", err); };
const mockStorageService = {
  saveData: (payload) => { console.log("Mock storageService.saveData called with (readingData length, stats totalBooks):", payload.readingData?.length, payload.stats?.totalBooks); }
};
const mockCalculateGoalProgress = (books) => { // Simplified
  console.log("Mock calculateGoalProgress called with book count:", books.length);
  return { yearly: { current: books.length, target: 52, percentage: Math.round((books.length/52)*100) }, monthly: {current: books.length/12, target:4, percentage:0}};
};

const defaultEmptyStats = {
    totalBooks: 0, averageRating: 0, readingByYear: {}, readingByMonth: {},
    ratingDistribution: {}, bestYear: null, worstYear: null, averagePerYear: 0, averagePerMonth: 0,
    readingPace: { booksPerMonth: 0, booksPerYear: 0, pagesPerDay: 0 },
    pageStats: { totalPages: 0, averageLength: 0, longestBook: { title: '', pages: 0 } },
    topAuthors: [], readingByGenre: {}
};

// --- Start of calculateStats function (copied from ReadingDataContext.js and adapted) ---
const calculateStats = (books) => {
    // If books is empty or undefined, return a default stats object for the test script.
    if (!books || books.length === 0) {
      return defaultEmptyStats;
    }

    const booksWithValidDates = books.filter(book => book.dateRead && !isNaN(new Date(book.dateRead)));
    // console.log("calculateStats: Total books (original input):", books.length); // Already part of the function in source
    // console.log("calculateStats: Total books (with valid dates):", booksWithValidDates.length); // Already part of the function in source

    const booksIn2025 = booksWithValidDates.filter(book => {
      const year = new Date(book.dateRead).getFullYear();
      return year === 2025;
    });
    // console.log("calculateStats: Books read in 2025 (with valid dates):", booksIn2025.length); // Already part of the function in source

    if (booksWithValidDates.length === 0) {
      return {
        ...defaultEmptyStats,
        readingPace: {
          booksPerMonth: 0,
          booksPerYear: 0,
          pagesPerDay: 0
        }
      };
    }

    let earliestDate = new Date(booksWithValidDates[0].dateRead);
    let latestDate = new Date(booksWithValidDates[0].dateRead);

    booksWithValidDates.forEach(book => {
      const currentDate = new Date(book.dateRead);
      if (currentDate < earliestDate) {
        earliestDate = currentDate;
      }
      if (currentDate > latestDate) {
        latestDate = currentDate;
      }
    });

    let totalReadingDays = Math.max(1, Math.ceil((latestDate - earliestDate) / (1000 * 60 * 60 * 24)));
    if (earliestDate.getTime() === latestDate.getTime()) {
      totalReadingDays = 1;
    }

    let totalReadingMonths =
      (latestDate.getFullYear() - earliestDate.getFullYear()) * 12 +
      (latestDate.getMonth() - earliestDate.getMonth()) + 1;
    totalReadingMonths = Math.max(1, totalReadingMonths);

    const readingByYear = {};
    const readingByMonth = {};
    let totalPagesWithValidDates = 0;

    booksWithValidDates.forEach(book => {
      const year = new Date(book.dateRead).getFullYear().toString();
      const month = new Date(book.dateRead).getMonth();

      readingByYear[year] = (readingByYear[year] || 0) + 1;

      if (!readingByMonth[year]) readingByMonth[year] = Array(12).fill(0);
      readingByMonth[year][month]++;
      totalPagesWithValidDates += (book.pages || 0);
    });

    const authorCounts = {};
    booksWithValidDates.forEach(book => {
      if (book.author) {
        authorCounts[book.author] = (authorCounts[book.author] || 0) + 1;
      }
    });

    const topAuthors = Object.entries(authorCounts)
      .map(([author, count]) => ({ author, count }))
      .sort((a, b) => b.count - a.count);

    const numBooksWithValidDates = booksWithValidDates.length;

    const currentYear = new Date().getFullYear();
    const booksThisYear = booksWithValidDates.filter(book => {
      const year = new Date(book.dateRead).getFullYear();
      return year === currentYear;
    });
    const monthsElapsedThisYear = new Date().getMonth() + 1;
    const booksPerMonthCurrentYear = monthsElapsedThisYear > 0 ? booksThisYear.length / monthsElapsedThisYear : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBooks = booksWithValidDates.filter(book => {
      const readDate = new Date(book.dateRead);
      return readDate >= thirtyDaysAgo;
    });

    const recentPages = recentBooks.reduce((sum, book) => sum + (book.pages || 0), 0);
    const pagesPerDayLast30Days = recentBooks.length > 0 ? recentPages / 30 : 0;

    console.log("calculateStats: Total books (original input):", books.length);
    console.log("calculateStats: Total books (with valid dates):", booksWithValidDates.length);
    console.log("calculateStats: Books read in 2025 (with valid dates):", booksIn2025.length);
    console.log(`calculateStats: Current year for booksPerMonth calc: ${currentYear}, booksThisYear: ${booksThisYear.length}, monthsElapsed: ${monthsElapsedThisYear}`);
    console.log(`calculateStats: Recent books for pagesPerDay (count): ${recentBooks.length}, total recent pages: ${recentPages}`);


    return {
      totalBooks: books.length,
      averageRating: numBooksWithValidDates > 0
        ? booksWithValidDates.reduce((sum, book) => sum + (book.myRating || 0), 0) / numBooksWithValidDates
        : 0,
      readingByYear,
      readingByMonth,
      ratingDistribution: numBooksWithValidDates > 0
        ? booksWithValidDates.reduce((dist, book) => {
            const rating = Number(book.myRating);
            if (rating >= 1 && rating <= 5) {
              dist[rating] = (dist[rating] || 0) + 1;
            }
            return dist;
          }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
        : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      readingPace: {
        booksPerMonth: booksPerMonthCurrentYear,
        booksPerYear: numBooksWithValidDates,
        pagesPerDay: pagesPerDayLast30Days,
      },
      pageStats: {
        totalPages: totalPagesWithValidDates,
        averageLength: numBooksWithValidDates > 0 ? totalPagesWithValidDates / numBooksWithValidDates : 0,
        longestBook: numBooksWithValidDates > 0
          ? booksWithValidDates.reduce((longest, book) =>
              (book.pages > (longest?.pages || 0)) ? book : longest,
              { title: '', pages: 0 }
            )
          : { title: '', pages: 0 }
      },
      topAuthors,
      readingByGenre: {}
    };
};
// --- End of calculateStats function ---

// --- Start of processReadingData function (copied from ReadingDataContext.js and adapted) ---
const processReadingData = (data) => {
  // These console.logs are the BUG 2 additions
  console.log("processReadingData called with (typeof, isArray):", typeof data, Array.isArray(data), data && typeof data.books !== 'undefined' ? `object with books (len ${data.books?.length})` : '');
  console.log("Current readingData state before processing (length):", currentReadingData.length);
  mockSetLoading(true);
  try {
    if (data && data.books && typeof data.stats !== 'undefined') { // Check data.stats to be more specific
      console.log("processReadingData: Detected data.books and data.stats structure (FileUpload.js path)");
      mockSetReadingData(data.books);
      mockSetStats(data.stats); // Using the stats from input, not recalculating
      const gp = mockCalculateGoalProgress(data.books);
      mockSetGoalProgress(gp);
      mockStorageService.saveData({
        readingData: data.books,
        stats: data.stats, // Save the passed-in stats
        goalProgress: gp
      });
      return;
    }
    console.log("processReadingData: Processing as direct data or existing state (BUG 1 path)");
    const booksToProcess = data || currentReadingData; // BUG 1 FIX IS HERE
    console.log("processReadingData: booksToProcess length:", booksToProcess.length);
    const calculatedStats = calculateStats(booksToProcess);
    const calculatedGoalProgress = mockCalculateGoalProgress(booksToProcess);

    mockSetReadingData(booksToProcess);
    mockSetStats(calculatedStats);
    mockSetGoalProgress(calculatedGoalProgress);

    mockStorageService.saveData({
      readingData: booksToProcess,
      stats: calculatedStats,
      goalProgress: calculatedGoalProgress
    });
  } catch (error) {
    mockSetError(error);
    console.error("Error in processReadingData:", error);
  } finally {
    mockSetLoading(false);
  }
};
// --- End of processReadingData function ---

console.log("\n--- Test Case 1: Simulating BUG 1 scenario (direct array processing) ---");
currentReadingData = [];
currentStats = {};
currentGoalProgress = {};
processReadingData(sampleBooks);
console.log("Stats after Test Case 1 (totalBooks):", currentStats.totalBooks, "(pagesPerDay):", currentStats.readingPace?.pagesPerDay);
console.log("ReadingData after Test Case 1 (length):", currentReadingData.length);


console.log("\n--- Test Case 2: Simulating FileUpload.js scenario ({books, stats}) ---");
currentReadingData = [];
currentStats = {};
currentGoalProgress = {};
// For Test Case 2, processReadingData expects stats to be passed along with books.
// We'll pass defaultEmptyStats, as if it's a new file upload with no prior stats.
processReadingData({ books: sampleBooks, stats: defaultEmptyStats });
console.log("Stats after Test Case 2 (totalBooks):", currentStats.totalBooks, "(pagesPerDay):", currentStats.readingPace?.pagesPerDay);
console.log("ReadingData after Test Case 2 (length):", currentReadingData.length);

console.log("\n--- Test Case 3: Calling calculateStats directly with sampleBooks ---");
const directCalcStats = calculateStats(sampleBooks);
console.log("Direct calculateStats output (totalBooks):", directCalcStats.totalBooks, "(pagesPerDay):", directCalcStats.readingPace?.pagesPerDay, "(booksPerMonth):", directCalcStats.readingPace?.booksPerMonth);

console.log("\n--- Test Case 4: Calling calculateStats directly with empty array ---");
const directCalcStatsEmpty = calculateStats([]);
console.log("Direct calculateStats with empty array (totalBooks):", directCalcStatsEmpty.totalBooks);

console.log("\n--- Test Case 5: Calling processReadingData with null (should use currentReadingData if not empty, or process empty) ---");
currentReadingData = [sampleBooks[0]]; // Pre-fill currentReadingData with one book
currentStats = {};
currentGoalProgress = {};
console.log("processReadingData with null, currentReadingData has 1 book initially.");
processReadingData(null);
console.log("Stats after Test Case 5 (totalBooks):", currentStats.totalBooks);
console.log("ReadingData after Test Case 5 (length):", currentReadingData.length);

console.log("\nScript finished.");
// Expected pagesPerDay for sampleBooks: All 16 books are in 2025.
// If 'today' is e.g. June 2024, none of these are "recent" for pagesPerDay.
// If 'today' is e.g. May 15, 2025 (as per data design):
// Recent books: Book 11 to Book 16 (6 books).
// Pages: 150 (Apr 20) + 110 (Apr 25) + 90 (Apr 28) + 130 (May 01) + 100 (May 05) + 120 (May 10) = 700
// pagesPerDay = 700 / 30 = 23.333...
// booksPerMonth: If current month during test is Jan 2025, it would be 4/1 = 4. If Feb 2025, it would be 3/2 = 1.5 etc.
// If current month is outside 2025, booksPerMonth for current year will be 0.
// booksPerYear (in readingPace) is simply the total count of valid date books, which is 16.
