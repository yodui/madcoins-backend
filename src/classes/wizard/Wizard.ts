

class Wizard {

    // interval id
    private static intervalId = null;

    // tick period
    private static castInterval = 2000; // ms

    // tick id
    static tickId: number = 0;


    public static run () {
        this.intervalId = setInterval(() => this.tick(), this.castInterval);
    }


    private static tick () {
        this.tickId++;
        console.log('tick:', this.tickId);
        //
    }

}


export { Wizard };
