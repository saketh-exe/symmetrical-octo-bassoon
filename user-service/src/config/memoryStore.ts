export class MemoryStore {
    private store: Map<string,string> = new Map();
    set(key:string,value:string) {this.store.set(key,value)}
    get(key:string){return this.store.get(key)}
    delete(key:string){this.store.delete(key)}
}
export default new MemoryStore();