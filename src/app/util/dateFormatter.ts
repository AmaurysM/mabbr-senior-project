export const formatDate = (timeString: string) => {
    try {
      let date;
      if (typeof timeString === 'string' && /^\d{8}T\d{6}$/.test(timeString)) {
        const year = timeString.slice(0, 4);
        const month = timeString.slice(4, 6);
        const day = timeString.slice(6, 8);
        const hour = timeString.slice(9, 11);
        const minute = timeString.slice(11, 13);
        const second = timeString.slice(13, 15);
        const formattedTime = `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
        date = new Date(formattedTime);
      } else {
        date = new Date(timeString);
      }
      return isNaN(date.getTime())
        ? 'N/A'
        : date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };