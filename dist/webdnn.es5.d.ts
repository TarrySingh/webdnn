declare namespace WebDNN {
    /**
     * Graph Descriptor
     */
    interface GraphDescriptor {
        /**
         * input variables' name
         */
        inputs: string[];
        /**
         * output variables' name
         */
        outputs: string[];
        memory_layout: MemoryLayout;
        /**
         * Allocation information for each variable.
         */
        weight_allocation: {
            allocations: {
                [name: string]: any;
            };
        };
        /**
         * Allocation information for each variable.
         */
        variable_allocation: {
            allocations: {
                [name: string]: any;
            };
        };
        /**
         * Encoding algorithm of weight binary data.
         */
        weight_encoding: string;
    }
}
declare namespace WebDNN {
    /**
     * `DescriptorRunner` executes computation based on `GraphDescriptor`.
     */
    abstract class DescriptorRunner<D extends GraphDescriptor> {
        readonly backendName: string;
        descriptor: D | null;
        ignoreCache: boolean;
        /**
         * Fetch descriptor from specified directory.
         * @param directory directory where descriptor is contained.
         * You can also provide URL of other domain like this.
         *
         * ```javascript
         * await runner.load('://my.other.domain.com/my_model');
         * ```
         *
         * However sometimes it can't because of Cross-Origin-Resource-Security policy.
         *
         * @param progressCallback callback which is called to notice the loading is progressing.
         */
        abstract load(directory: string, progressCallback?: (loaded: number, total: number) => any): Promise<void>;
        /**
         * set descriptor.
         * @param descriptor descriptor which will be executed.
         */
        abstract setDescriptor(descriptor: D): void;
        /**
         * compile kernels.
         */
        abstract compile(): Promise<void>;
        /**
         * load weight data
         * @param weightsData weights data
         */
        abstract loadWeights(weightsData: Uint8Array): Promise<void>;
        /**
         * Run descriptor. You must call [[getInputViews]] and [[getOutputViews]] before calling this function.
         */
        abstract run(): Promise<void>;
        /**
         * Get input ArrayBufferView object
         */
        abstract getInputViews(): Promise<Float32Array[]>;
        /**
         * Get output ArrayBufferView object
         */
        abstract getOutputViews(): Promise<Float32Array[]>;
    }
}
declare namespace WebDNN {
    abstract class GPUInterface<D extends GraphDescriptor, R extends DescriptorRunner<D>> {
        readonly backendName: string;
        constructor(option?: any);
        abstract init(): Promise<void>;
        abstract createDescriptorRunner(): R;
    }
}
declare namespace WebDNN {
    /**
     * Abstract buffer interface. Read/write transactions are regarded as asynchronous operation.
     */
    abstract class Buffer {
        byteLength: number;
        backed: string;
        constructor(byteLength: number, backed: string);
        /**
         * Write contents into specified position.
         * @param src contents souce buffer.
         * @param dst_offset position where contents are written on
         */
        abstract write(src: ArrayBufferView, dst_offset?: number): Promise<void>;
        /**
         * Read contents from specified position.
         * @param dst buffer where contents are written on
         * @param src_offset position where contents are read from
         * @param length contents length
         */
        abstract read(dst: ArrayBufferView, src_offset?: number, length?: number): Promise<void>;
        /**
         * for a range which will be written from CPU iteratively, make view to avoid copy (if backend allows)
         * if backend does not allow such operation, return newly allocated memory and send their contents to GPU when syncWriteViews is called
         * @param offset position where buffer-view begin from
         * @param length buffer-view length
         * @param number_type data format such as Float32, UInt8, and so on.
         */
        abstract getWriteView(offset: number, length: number, number_type: any): ArrayBufferView;
        /**
         * for a range which will be read from CPU iteratively, make view to avoid copy (if backend allows)
         * if backend does not allow such operation, return newly allocated memory and fill their contents from GPU when syncReadViews is called
         * @param offset position where buffer-view begin from
         * @param length buffer-view length
         * @param number_type data format such as Float32, UInt8, and so on.
         */
        abstract getReadView(offset: number, length: number, number_type: any): ArrayBufferView;
        /**
         * Sync buffered data into memory.
         */
        abstract syncWriteViews(): Promise<void>;
        /**
         * Sync memory data into buffer view.
         */
        abstract syncReadViews(): Promise<void>;
    }
}
declare namespace WebDNN {
    class BufferWebGPU extends Buffer {
        private static webgpuHandler;
        buffer: WebGPUBuffer;
        bufferView: Uint8Array;
        constructor(byteLength: number);
        write(src: ArrayBufferView, dst_offset?: number): Promise<void>;
        read<T extends ArrayBufferView>(dst: T, src_offset?: number, length?: number): Promise<void>;
        static init(webgpuHandler: WebGPUHandler): void;
        getWriteView(offset: number, length: number, number_type: any): ArrayBufferView;
        getReadView(offset: number, length: number, number_type: any): ArrayBufferView;
        syncWriteViews(): Promise<void>;
        syncReadViews(): Promise<void>;
    }
}
declare namespace WebDNN {
    class WebGPUHandler {
        static isBrowserSupported: boolean;
        private context;
        private commandQueue;
        private pipelineStates;
        init(): Promise<void>;
        createBuffer(arrayBuffer: ArrayBufferView): WebGPUBuffer;
        loadKernel(librarySource: string, namespace?: string): void;
        createCommandBuffer(): WebGPUCommandBuffer;
        getPipelineStateByName(name: string): WebGPUComputePipelineState;
        executeSinglePipelineState(name: string, threadgroupsPerGrid: WebGPUSize, threadsPerThreadgroup: WebGPUSize, buffers: (WebGPUBuffer | BufferWebGPU)[], getCompletedPromise?: boolean): Promise<void> | null;
        sync(): Promise<void>;
    }
}
interface WebGPURenderingContext {
    createCommandQueue(): WebGPUCommandQueue;
    createBuffer(data: ArrayBufferView): WebGPUBuffer;
    createLibrary(sourceCode: string): WebGPULibrary;
    createComputePipelineState(function_: WebGPUFunction): WebGPUComputePipelineState;
}
interface WebGPUFunction {
}
interface WebGPULibrary {
    functionNames: string[];
    functionWithName(name: string): WebGPUFunction;
}
interface WebGPUBuffer {
    contents: any;
}
interface WebGPUSize {
    width: number;
    height: number;
    depth: number;
}
interface WebGPUCommandQueue {
    createCommandBuffer(): WebGPUCommandBuffer;
}
interface WebGPUCommandBuffer {
    createComputeCommandEncoder(): WebGPUComputeCommandEncoder;
    commit(): void;
    completed: Promise<void>;
}
interface WebGPUCommandEncoder {
    endEncoding(): void;
}
interface WebGPUComputeCommandEncoder extends WebGPUCommandEncoder {
    setComputePipelineState(state: WebGPUComputePipelineState): void;
    setBuffer(buffer: WebGPUBuffer, offset: number, index: number): void;
    dispatch(threadgroupsPerGrid: WebGPUSize, threadsPerThreadgroup: WebGPUSize): void;
}
interface WebGPUComputePipelineState {
}
declare namespace WebDNN {
    class WeightDecoderRaw implements WeightDecoder {
        decode(data: Uint8Array, memory_layout: MemoryLayout): Promise<Float32Array>;
    }
}
declare namespace WebDNN {
    interface WeightDecoder {
        decode(data: Uint8Array, memory_layout: MemoryLayout): Promise<Float32Array>;
    }
    interface MemoryLayout {
        total_size: number;
        allocations: {
            [index: string]: {
                name: string;
                offset: number;
                size: number;
            };
        };
    }
}
declare var Zlib: any;
declare namespace WebDNN {
    class WeightDecoderEightbit implements WeightDecoder {
        static decode_table: number[];
        decode(data: Uint8Array, memory_layout: MemoryLayout): Promise<Float32Array>;
    }
}
declare namespace WebDNN {
    function get_weight_decoder(name: string): WeightDecoder;
}
declare namespace WebDNN {
    namespace util {
        /**
         *  Schedule function which is called too much frequently.
         */
        class DispatchScheduler {
            private scheduledCallbackId;
            private fn;
            /**
             * Register scheduled function. If already other function is scheduled, it is canceled and dispatcher will dispatch only
             * function which is registered at last.
             * @param fn scheduled function
             */
            request(fn: () => any): void;
            /**
             * Dispatch scheduled function just now. If no function is scheduled, dispatcher do nothing.
             */
            forceDispatch(): void;
            /**
             * Cancel scheduled function. If no function is scheduled, dispatcher do nothing.
             */
            cancel(): void;
        }
    }
}
declare let transformDelegate: (base: string) => string;
/**
 * Fetch delegate function.
 * Every fetch call in WebDNN is delegated to this function.
 * As default, `window.fetch` is set.
 * @type {(input:RequestInfo, init?:RequestInit)=>Promise<Response>}
 */
declare let fetchDelegate: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
declare namespace WebDNN {
    /**
     * Register delegate function for transform url
     * @param url url which will be transformed
     */
    function transformUrl(url: string): string;
    /**
     * Register delegate function for transform url
     * @param delegate delegate function
     */
    function registerTransformDelegate(delegate: (base: string) => string): void;
    /**
     * Register delegate function for fetch
     * @param delegate delegate function
     */
    function registerFetchDelegate(delegate: (input: RequestInfo, init?: RequestInit) => Promise<Response>): void;
    /**
     * Fetch function. WebDNN API use this fetch function instead of original fetch function.
     * @param input Requested url
     * @param init Additional information about fetch
     * @returns Response
     */
    function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>;
    /**
     * Read `Response.body` stream as ArrayBuffer. This function provide progress information by callback.
     * @param res Response object
     * @param callback Callback function.
     * @returns ArrayBuffer
     */
    function readArrayBufferProgressively(res: Response, callback?: (loaded: number, total: number) => any): Promise<ArrayBuffer>;
}
declare namespace WebDNN {
    interface GraphDescriptorWebGPU extends GraphDescriptor {
        memory_layout: MemoryLayout;
        kernel_source: string;
        exec_infos: GraphDescriptorWebGPUExecInfos[];
    }
    interface GraphDescriptorWebGPUExecInfos {
        entry_func_name: string;
        threadgroups_per_grid: WebGPUSize;
        threads_per_thread_group: WebGPUSize;
        meta_buffer: number[];
    }
}
declare namespace WebDNN {
    class DescriptorRunnerWebGPU extends DescriptorRunner<GraphDescriptorWebGPU> {
        private gpuHandler;
        readonly backendName: string;
        dataBuffer: BufferWebGPU | null;
        metaBuffers: BufferWebGPU[] | null;
        inputViews: Float32Array[] | null;
        outputViews: Float32Array[] | null;
        constructor(gpuHandler: WebGPUHandler);
        load(directory: string, progressCallback?: (loaded: number, total: number) => any): Promise<void>;
        setDescriptor(descriptor: GraphDescriptorWebGPU): void;
        compile(): Promise<void>;
        loadWeights(data: Uint8Array): Promise<void>;
        getInputViews(): Promise<Float32Array[]>;
        getOutputViews(): Promise<Float32Array[]>;
        run(): Promise<void>;
    }
}
declare let WebGPUComputeCommandEncoder: any;
declare namespace WebDNN {
    class GPUInterfaceWebGPU extends GPUInterface<GraphDescriptorWebGPU, DescriptorRunnerWebGPU> {
        readonly backendName: string;
        webgpuHandler: WebGPUHandler;
        shaderLanguage: string;
        constructor(option?: any);
        init(): Promise<void>;
        private init_basic_kernels();
        createDescriptorRunner(): DescriptorRunnerWebGPU;
    }
}
declare namespace WebDNN {
    interface GraphDescriptorWebassembly extends GraphDescriptor {
        memory_layout: MemoryLayout;
    }
}
declare namespace WebDNN {
    class DescriptorRunnerWebassembly extends DescriptorRunner<GraphDescriptorWebassembly> {
        readonly backendName: string;
        inputViews: Float32Array[] | null;
        outputViews: Float32Array[] | null;
        worker: Worker | null;
        worker_entry_js_path: any;
        worker_promise_reject_func: any;
        worker_initial_error: any;
        load(directory: string, progressCallback?: (loaded: number, total: number) => any): Promise<void>;
        setDescriptor(descriptor: GraphDescriptorWebassembly): void;
        compile(): Promise<void>;
        loadWeights(weightsData: Uint8Array): Promise<void>;
        getInputViews(): Promise<Float32Array[]>;
        getOutputViews(): Promise<Float32Array[]>;
        run(): Promise<void>;
    }
}
declare let WebAssembly: any;
declare namespace WebDNN {
    class GPUInterfaceWebassembly extends GPUInterface<GraphDescriptorWebassembly, DescriptorRunnerWebassembly> {
        readonly backendName: string;
        constructor(option?: any);
        init(): Promise<void>;
        createDescriptorRunner(): DescriptorRunnerWebassembly;
    }
}
declare namespace WebDNN {
    interface GraphDescriptorFallback extends GraphDescriptor {
        weight_allocation: {
            total_size: number;
            allocations: {
                [index: string]: {
                    name: string;
                    offset: number;
                    size: number;
                };
            };
        };
        variable_allocation: {
            total_size: number;
            allocations: {
                [index: string]: {
                    name: string;
                    offset: number;
                    size: number;
                };
            };
        };
        kernel_source: string;
        exec_infos: GraphDescriptorFallbackExecInfo[];
    }
    interface GraphDescriptorFallbackExecInfo {
        entry_func_name: string;
        inputs: string[];
        outputs: string[];
        weights: string[];
        call_option: any;
    }
}
declare namespace WebDNN {
    class DescriptorRunnerFallback extends DescriptorRunner<GraphDescriptorFallback> {
        readonly backendName: string;
        kernelObj: any;
        rawWeightArray: Float32Array | null;
        weightArrays: Map<string, Float32Array> | null;
        variableArrays: Map<string, Float32Array> | null;
        inputViews: Float32Array[] | null;
        outputViews: Float32Array[] | null;
        load(directory: string, progressCallback?: (loaded: number, total: number) => any): Promise<void>;
        setDescriptor(descriptor: GraphDescriptorFallback): void;
        compile(): Promise<void>;
        private compileKernel();
        loadWeights(weightsData: Uint8Array): Promise<void>;
        run(): Promise<void>;
        wait_to_display(): Promise<{}>;
        getInputViews(): Promise<Float32Array[]>;
        getOutputViews(): Promise<Float32Array[]>;
    }
}
declare namespace WebDNN {
    class GPUInterfaceFallback extends GPUInterface<GraphDescriptorFallback, DescriptorRunnerFallback> {
        readonly backendName: string;
        init(option?: any): Promise<void>;
        createDescriptorRunner(): DescriptorRunnerFallback;
    }
}
declare namespace WebDNN {
    const backends: {
        'webgpu': typeof GPUInterfaceWebGPU;
        'webassembly': typeof GPUInterfaceWebassembly;
        'fallback': typeof GPUInterfaceFallback;
    };
    let gpu: GPUInterface<GraphDescriptor, DescriptorRunner<GraphDescriptor>> | null;
    let backendName: string;
    let DEBUG: boolean;
    function init(backendOrder?: string | string[], backendOptions?: {
        [key: string]: any;
    }): Promise<string>;
    /**
     * Prepare backend interface and load model data at once. Internally calls init().
     * @param backendOrder The trying order of backend names to be initialized.
     * @param backendOptions Backend options.
     * @param progressCallback callback which is called to notice the loading is progressing.
     */
    interface InitOption {
        backendOrder?: string | string[];
        backendOptions?: {
            [key: string]: any;
        };
        progressCallback?: (loaded: number, total: number) => any;
    }
    /**
     * Prepare backend interface and load model data at once. Internally calls init().
     * @param directory URL of directory that contains graph descriptor files (e.g. graph_fallback.json)
     * @param initOption Initialize option
     * @return Interface to input/output data and run the model.
     */
    function prepareAll(directory: string, initOption?: InitOption): Promise<GraphInterface>;
    /**
     * Interface to input/output data and run the model.
     */
    interface GraphInterface {
        /**
         * The name of backend.
         */
        backendName: string;
        /**
         * The buffers to write input data.
         */
        inputViews: Float32Array[];
        /**
         * The buffers to read output data.
         */
        outputViews: Float32Array[];
        /**
         * Run the model.
         */
        run: () => Promise<void>;
    }
}
declare namespace WebDNN {
    namespace Math {
        /**
         * Return indices of the top-K largest samples.
         * @param arr array
         * @param k number of indices
         * @returns {number[]} indices of top-K largest samples
         */
        function argmax(arr: number[], k?: number): number[];
        /**
         * Return indices of the top-K smallest samples.
         * @param arr array
         * @param k number of indices
         * @returns {number[]} indices of top-K smallest samples
         */
        function argmin(arr: number[], k?: number): number[];
    }
}
declare namespace WebDNN {
    /**
     * Check backend availability
     * @returns List of backend availability and default selected backend order
     */
    function getBackendAvailability(): {
        status: {
            [name: string]: boolean;
        };
        defaultOrder: string[];
    };
}
