export function formatToReadableDate(input: any): string {
    let date: Date;
  
    // 1. If already a Date object
    if (input instanceof Date) {
      date = input;
    } 
    else if (typeof input === "string") {
  
      // Detect MM-DD-YYYY format (example: "03-04-2025")
      const mmddyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
      if (mmddyyyy.test(input)) {
        const [_, mm, dd, yyyy] = input.match(mmddyyyy)!;
        date = new Date(`${yyyy}-${mm}-${dd}`);
      }
  
      // Detect DD-MM-YYYY format (example: "04-03-2025")
      else if (/^(\d{2})-(\d{2})-(\d{4})$/.test(input)) {
        const [_, dd, mm, yyyy] = input.match(mmddyyyy)!;
        date = new Date(`${yyyy}-${mm}-${dd}`);
      }
  
      // Default ISO parser (YYYY-MM-DD or timestamp)
      else {
        date = new Date(input);
      }
    } 
    else {
      date = new Date(input);
    }
  
    // Final validation
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date passed: ${input}`);
    }
  
    // Format: "04 March 2025"
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = date.getFullYear();
  
    return `${day} ${month} ${year}`;
  }
  